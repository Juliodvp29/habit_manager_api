import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { VerificationService } from '../verification/verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private settingsRepository: Repository<UserSettings>,
    private jwtService: JwtService,
    private verificationService: VerificationService,
  ) { }

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

    // DOBLE VERIFICACIÓN (2FA) - Siempre activada para mayor seguridad
    const requires2FA = true;

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
        message: 'Se ha enviado un código de verificación a tu email',
        userId: user.id,
        email: this.maskEmail(user.email),
      };
    }

    // Si no requiere 2FA, generar token directamente
    return this.generateLoginResponse(user, ipAddress, userAgent);
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

  private async generateLoginResponse(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Generar token
    const token = this.generateToken(user);

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
      token,
      message: 'Login exitoso',
    };
  }

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

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername =
      username.charAt(0) +
      '*'.repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }
}