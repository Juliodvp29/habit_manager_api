// src/verification/verification.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LessThan, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { User } from '../entities/user.entity';
import {
  VerificationCode,
  VerificationType,
} from '../entities/verification-code.entity';

@Injectable()
export class VerificationService {
  private readonly maxAttempts: number;
  private readonly codeExpirationMinutes: number;

  constructor(
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.maxAttempts = this.configService.get('MAX_VERIFICATION_ATTEMPTS', 3);
    this.codeExpirationMinutes = 10;
  }

  // Generar código aleatorio de 6 dígitos
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Calcular fecha de expiración
  private getExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.codeExpirationMinutes);
    return expiresAt;
  }

  // Crear o actualizar código de verificación

  // ✅ MEJORAR: Usar transacción para evitar race conditions
  async createVerificationCode(userId: number, type: VerificationType): Promise<string> {
    return await this.verificationCodeRepository.manager.transaction(async manager => {
      // Eliminar códigos anteriores
      await manager.delete(VerificationCode, {
        user: { id: userId },
        type,
        isUsed: false,
      });

      // Crear nuevo código
      const code = this.generateCode();
      const expiresAt = this.getExpirationDate();

      const verificationCode = manager.create(VerificationCode, {
        user: { id: userId },
        code,
        type,
        expiresAt,
      });

      await manager.save(verificationCode);
      return code;
    });
  }

  // Enviar código de verificación de email
  async sendEmailVerification(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    const code = await this.createVerificationCode(
      userId,
      'email_verification',
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      code,
      user.fullName,
    );

    return {
      message: 'Código de verificación enviado',
      email: this.maskEmail(user.email),
      expiresIn: `${this.codeExpirationMinutes} minutos`,
    };
  }

  // Verificar código de email
  async verifyEmail(email: string, code: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    const verification = await this.verificationCodeRepository.findOne({
      where: {
        user: { id: user.id },
        type: 'email_verification',
        isUsed: false,
      },
      relations: ['user'],
    });

    if (!verification) {
      throw new BadRequestException('Código inválido o expirado');
    }

    // Verificar si expiró
    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('El código ha expirado');
    }

    // Verificar intentos
    if (verification.attempts >= this.maxAttempts) {
      throw new BadRequestException(
        'Demasiados intentos. Solicita un nuevo código',
      );
    }

    // Verificar código
    if (verification.code !== code) {
      verification.attempts += 1;
      await this.verificationCodeRepository.update(verification.id, { attempts: verification.attempts });
      throw new BadRequestException(
        `Código incorrecto. Intentos restantes: ${this.maxAttempts - verification.attempts}`,
      );
    }

    // Marcar código como usado
    await this.verificationCodeRepository.update(verification.id, { isUsed: true });

    // Actualizar usuario
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.userRepository.save(user);

    return {
      message: 'Email verificado exitosamente',
      verified: true,
    };
  }

  // Reenviar código de verificación
  async resendVerificationCode(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    return await this.sendEmailVerification(user.id);
  }

  // Enviar código 2FA para login
  async send2FACode(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const code = await this.createVerificationCode(userId, '2fa_login');

    await this.emailService.send2FACode(user.email, code, user.fullName);

    return {
      message: 'Código de autenticación enviado',
      email: this.maskEmail(user.email),
      requires2FA: true,
    };
  }

  // Verificar código 2FA
  async verify2FACode(userId: number, code: string): Promise<boolean> {
    console.log(`🔍 Verificando 2FA para usuario ${userId}, código recibido: "${code}"`);

    const verification = await this.verificationCodeRepository.findOne({
      where: {
        user: { id: userId },
        type: '2fa_login',
        isUsed: false,
      },
    });

    if (!verification) {
      console.log(`❌ No se encontró código 2FA activo para usuario ${userId}`);
      throw new BadRequestException('Código inválido');
    }

    console.log(`📋 Código almacenado: "${verification.code}"`);
    console.log(`⏰ Código expirará en: ${verification.expiresAt}`);
    console.log(`📊 Intentos actuales: ${verification.attempts}/${this.maxAttempts}`);

    if (new Date() > verification.expiresAt) {
      console.log(`⏰ Código expirado para usuario ${userId}`);
      throw new BadRequestException('El código ha expirado');
    }

    if (verification.attempts >= this.maxAttempts) {
      console.log(`🚫 Demasiados intentos para usuario ${userId}`);
      throw new BadRequestException('Demasiados intentos');
    }

    if (verification.code !== code) {
      console.log(`❌ Código incorrecto. Esperado: "${verification.code}", Recibido: "${code}"`);
      verification.attempts += 1;
      await this.verificationCodeRepository.update(verification.id, { attempts: verification.attempts });
      throw new BadRequestException('Código incorrecto');
    }

    console.log(`✅ Código 2FA correcto para usuario ${userId}`);

    // 🔧 SOLUCIÓN: Eliminar códigos usados antiguos antes de marcar el nuevo como usado
    await this.verificationCodeRepository.delete({
      user: { id: userId },
      type: '2fa_login',
      isUsed: true,
    });

    // Ahora marcar el código actual como usado
    await this.verificationCodeRepository.update(verification.id, { isUsed: true });

    return true;
  }

  // Solicitar recuperación de contraseña
  async requestPasswordReset(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Por seguridad, no revelar si el email existe
      return {
        message: 'Si el email existe, recibirás un código de recuperación',
      };
    }

    const code = await this.createVerificationCode(user.id, 'password_reset');

    await this.emailService.sendPasswordResetEmail(
      user.email,
      code,
      user.fullName,
    );

    return {
      message: 'Código de recuperación enviado',
      email: this.maskEmail(user.email),
    };
  }

  // Restablecer contraseña
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const verification = await this.verificationCodeRepository.findOne({
      where: {
        user: { id: user.id },
        type: 'password_reset',
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Código inválido o expirado');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('El código ha expirado');
    }

    if (verification.attempts >= this.maxAttempts) {
      throw new BadRequestException('Demasiados intentos');
    }

    if (verification.code !== code) {
      verification.attempts += 1;
      await this.verificationCodeRepository.update(verification.id, { attempts: verification.attempts });
      throw new BadRequestException('Código incorrecto');
    }

    // Marcar código como usado
    await this.verificationCodeRepository.update(verification.id, { isUsed: true });

    // Actualizar contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    return {
      message: 'Contraseña actualizada exitosamente',
      success: true,
    };
  }

  // Registrar intento de login
  async logLoginAttempt(
    userId: number,
    success: boolean,
    requires2fa: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const loginAttempt = this.loginAttemptRepository.create({
      user: { id: userId },
      success,
      requires2fa,
      ipAddress,
      userAgent,
    });

    await this.loginAttemptRepository.save(loginAttempt);
  }

  // Limpiar códigos expirados (se puede ejecutar con un cron job)
  async cleanExpiredCodes(): Promise<void> {
    await this.verificationCodeRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  // Utilidad: Ocultar parte del email
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername =
      username.charAt(0) +
      '*'.repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }
}