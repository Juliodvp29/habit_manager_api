import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { VerificationService } from '../verification/verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private settingsRepository: Repository<UserSettings>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private verificationService: VerificationService,
    private configService: ConfigService,
  ) { }

  // ========================================
  // GENERACIÓN DE TOKENS
  // ========================================

  /**
   * Generar Access Token (corta duración: 15 minutos)
   */
  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return this.jwtService.sign(payload, {
      expiresIn: '1d',
    });
  }

  /**
   * Generar Refresh Token (larga duración: 30 días)
   */
  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, {
      expiresIn: '90d',
    });
  }

  /**
   * Hash del token para almacenar en BD (seguridad)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ========================================
  // GESTIÓN DE REFRESH TOKENS EN BD
  // ========================================

  /**
   * Guardar refresh token en BD
   */
  private async saveRefreshToken(user: User, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    const tokenHash = this.hashToken(token);

    // Eliminar tokens revocados del mismo usuario (limpieza)
    await this.refreshTokenRepository.delete({
      user: { id: user.id },
      revoked: true,
    });

    const refreshToken = this.refreshTokenRepository.create({
      user,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Verificar si refresh token es válido
   */
  async verifyRefreshToken(userId: number, token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        user: { id: userId },
        tokenHash,
        revoked: false,
      },
    });

    if (!storedToken) {
      return false;
    }

    // Verificar si expiró
    if (new Date() > storedToken.expiresAt) {
      storedToken.revoked = true;
      await this.refreshTokenRepository.save(storedToken);
      return false;
    }

    return true;
  }

  // ========================================
  // AUTENTICACIÓN - REGISTRO
  // ========================================

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = this.userRepository.create({
      email,
      passwordHash,
      fullName,
    });

    const savedUser = await this.userRepository.save(user);

    // Crear configuración por defecto
    const settings = this.settingsRepository.create({
      user: savedUser,
    });
    await this.settingsRepository.save(settings);

    // Enviar código de verificación automáticamente
    await this.verificationService.sendEmailVerification(savedUser.id);

    // NO generar token aún - primero debe verificar email
    return {
      message: 'Usuario registrado. Por favor verifica tu email.',
      user: this.sanitizeUser(savedUser),
      emailSent: true,
      requiresVerification: true,
    };
  }

  // ========================================
  // AUTENTICACIÓN - LOGIN
  // ========================================

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['preferredLanguage', 'settings'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Registrar intento fallido
      await this.verificationService.logLoginAttempt(
        user.id,
        false,
        false,
        ipAddress,
        userAgent,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Verificar si el email está verificado
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Por favor verifica tu email antes de iniciar sesión',
      );
    }

    // 🔧 MEJORA: 2FA INTELIGENTE - Solo en casos sospechosos
    const requires2FA = await this.shouldRequire2FA(
      user.id,
      ipAddress,
      userAgent,
    );

    if (requires2FA) {
      // Enviar código 2FA
      await this.verificationService.send2FACode(user.id);

      // Registrar intento con 2FA pendiente
      await this.verificationService.logLoginAttempt(
        user.id,
        false,
        true,
        ipAddress,
        userAgent,
      );

      return {
        requires2FA: true,
        message:
          'Se ha detectado un inicio de sesión inusual. Se ha enviado un código de verificación a tu email',
        userId: user.id,
        email: this.maskEmail(user.email),
        reason: 'security_check',
      };
    }

    // Si no requiere 2FA, generar respuesta con tokens
    return this.generateLoginResponse(user, ipAddress, userAgent);
  }

  // ========================================
  // 2FA INTELIGENTE
  // ========================================

  /**
   * 🧠 LÓGICA INTELIGENTE PARA 2FA
   * Decide si se requiere 2FA basado en:
   * 1. Nueva IP/dispositivo
   * 2. Tiempo desde último login
   * 3. Cambio de ubicación (opcional)
   */
  private async shouldRequire2FA(
    userId: number,
    currentIp?: string,
    currentUserAgent?: string,
  ): Promise<boolean> {
    // Obtener últimos 5 logins exitosos del usuario
    const recentLogins = await this.loginAttemptRepository.find({
      where: { user: { id: userId }, success: true },
      order: { attemptedAt: 'DESC' },
      take: 5,
    });

    // CASO 1: Si es el primer login, NO pedir 2FA (ya verificó email)
    if (recentLogins.length === 0) {
      return false;
    }

    // CASO 2: Nueva IP detectada
    if (currentIp) {
      const knownIps = recentLogins.map((login) => login.ipAddress);
      const isNewIp = !knownIps.includes(currentIp);

      if (isNewIp) {
        console.log(
          `🔒 2FA requerido: Nueva IP detectada para usuario ${userId}`,
        );
        return true;
      }
    }

    // CASO 3: Nuevo dispositivo/navegador detectado
    if (currentUserAgent) {
      const knownUserAgents = recentLogins.map((login) => login.userAgent);
      const isNewDevice = !knownUserAgents.includes(currentUserAgent);

      if (isNewDevice) {
        console.log(
          `🔒 2FA requerido: Nuevo dispositivo detectado para usuario ${userId}`,
        );
        return true;
      }
    }

    // CASO 4: Mucho tiempo sin iniciar sesión (más de 30 días)
    const lastLogin = recentLogins[0];
    const daysSinceLastLogin = Math.floor(
      (new Date().getTime() - new Date(lastLogin.attemptedAt).getTime()) /
      (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastLogin > 30) {
      console.log(
        `🔒 2FA requerido: ${daysSinceLastLogin} días sin actividad para usuario ${userId}`,
      );
      return true;
    }

    // CASO 5: Login desde dispositivo conocido reciente - NO pedir 2FA
    console.log(
      `✅ Login desde dispositivo conocido - Sin 2FA para usuario ${userId}`,
    );
    return false;
  }

  // ========================================
  // VERIFICACIÓN 2FA
  // ========================================

  async verify2FA(
    data: Verify2FADto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.verify2FAAndLogin(data.userId, data.code, ipAddress, userAgent);
  }

  async verify2FAAndLogin(
    userId: number,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferredLanguage', 'settings'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar código 2FA
    const isValid = await this.verificationService.verify2FACode(userId, code);

    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    return this.generateLoginResponse(user, ipAddress, userAgent);
  }

  // ========================================
  // GENERACIÓN DE RESPUESTA DE LOGIN
  // ========================================

  private async generateLoginResponse(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Generar ambos tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Guardar refresh token en BD
    await this.saveRefreshToken(user, refreshToken);

    // Registrar login exitoso
    await this.verificationService.logLoginAttempt(
      user.id,
      true,
      false,
      ipAddress,
      userAgent,
    );

    return {
      user: this.sanitizeUser(user),
      accessToken, // Token corta duración (15 min)
      refreshToken, // Token larga duración (30 días)
      token: accessToken, // Mantener por compatibilidad con cliente anterior
      message: 'Login exitoso',
    };
  }

  // ========================================
  // RENOVACIÓN DE TOKENS
  // ========================================

  /**
   * Renovar access token usando refresh token
   */
  async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<any> {
    // Verificar que el refresh token sea válido
    const isValid = await this.verifyRefreshToken(userId, refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['preferredLanguage'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Generar nuevo access token
    const newAccessToken = this.generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      message: 'Token renovado',
    };
  }

  // ========================================
  // LOGOUT
  // ========================================

  /**
   * Logout: revocar refresh token
   */
  async logout(userId: number, refreshToken: string): Promise<any> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token requerido');
    }

    const tokenHash = this.hashToken(refreshToken);

    const result = await this.refreshTokenRepository.update(
      {
        user: { id: userId },
        tokenHash,
      },
      { revoked: true },
    );

    if (result.affected === 0) {
      console.warn(`Token no encontrado para revocar - Usuario: ${userId}`);
    }

    return { message: 'Logout exitoso' };
  }

  // ========================================
  // PERFIL DE USUARIO
  // ========================================

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferredLanguage', 'settings'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.sanitizeUser(user);
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private sanitizeUser(user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername =
      username.charAt(0) +
      '*'.repeat(Math.max(0, username.length - 2)) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }
}