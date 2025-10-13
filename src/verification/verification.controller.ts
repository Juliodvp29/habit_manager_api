import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) { }

  // Enviar código de verificación de email (requiere autenticación)
  @UseGuards(JwtAuthGuard)
  @Post('send-email-code')
  sendEmailVerification(@Request() req) {
    return this.verificationService.sendEmailVerification(req.user.id);
  }

  // Verificar código de email
  @Post('verify-email')
  verifyEmail(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.verificationService.verifyEmail(
      verifyCodeDto.email,
      verifyCodeDto.code,
    );
  }

  // Reenviar código de verificación
  @Post('resend-code')
  resendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.verificationService.resendVerificationCode(
      resendCodeDto.email,
    );
  }

  // Solicitar código de recuperación de contraseña
  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.verificationService.requestPasswordReset(dto.email);
  }

  // Restablecer contraseña con código
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.verificationService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }

  // Enviar código 2FA (requiere autenticación)
  @UseGuards(JwtAuthGuard)
  @Post('send-2fa-code')
  send2FACode(@Request() req) {
    return this.verificationService.send2FACode(req.user.id);
  }
}