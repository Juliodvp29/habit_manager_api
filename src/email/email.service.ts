import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, code: string, userName?: string) {
    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: '🔐 Código de Verificación - Habit Manager',
      html: this.getVerificationEmailTemplate(code, userName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  async send2FACode(email: string, code: string, userName?: string) {
    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: '🔒 Código de Autenticación - Habit Manager',
      html: this.get2FAEmailTemplate(code, userName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending 2FA email:', error);
      throw new Error('No se pudo enviar el código de autenticación');
    }
  }

  async sendPasswordResetEmail(email: string, code: string, userName?: string) {
    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: '🔑 Recuperación de Contraseña - Habit Manager',
      html: this.getPasswordResetTemplate(code, userName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  private getVerificationEmailTemplate(code: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Habit Manager</h1>
            <p>Verificación de Cuenta</p>
          </div>
          <div class="content">
            <p>Hola ${userName || 'Usuario'},</p>
            <p>Gracias por registrarte en <strong>Habit Manager</strong>. Para completar tu registro, por favor verifica tu correo electrónico usando el siguiente código:</p>
            
            <div class="code">${code}</div>
            
            <p>Este código es válido por <strong>10 minutos</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Si no solicitaste este código, por favor ignora este correo. Tu cuenta permanecerá segura.
            </div>
            
            <p>¡Estamos emocionados de ayudarte a construir mejores hábitos! 💪</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Habit Manager. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private get2FAEmailTemplate(code: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: white; border: 2px solid #f5576c; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f5576c; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(245, 87, 108, 0.2); }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .security { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Verificación de Seguridad</h1>
            <p>Autenticación de Dos Factores</p>
          </div>
          <div class="content">
            <p>Hola ${userName || 'Usuario'},</p>
            <p>Se ha detectado un intento de inicio de sesión en tu cuenta. Para continuar, por favor ingresa el siguiente código de verificación:</p>
            
            <div class="code">${code}</div>
            
            <p>Este código expirará en <strong>10 minutos</strong>.</p>
            
            <div class="security">
              <strong>🛡️ Seguridad:</strong> Si no intentaste iniciar sesión, cambia tu contraseña inmediatamente y contacta a soporte.
            </div>
            
            <p><strong>Detalles del intento:</strong></p>
            <ul>
              <li>Fecha y hora: ${new Date().toLocaleString('es-ES')}</li>
              <li>Ubicación aproximada: (Según IP)</li>
            </ul>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Habit Manager. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(code: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: white; border: 2px solid #00f2fe; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4facfe; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .alert { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Recuperación de Contraseña</h1>
            <p>Habit Manager</p>
          </div>
          <div class="content">
            <p>Hola ${userName || 'Usuario'},</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar:</p>
            
            <div class="code">${code}</div>
            
            <p>Este código es válido por <strong>10 minutos</strong>.</p>
            
            <div class="alert">
              <strong>⚠️ Alerta de Seguridad:</strong> Si no solicitaste restablecer tu contraseña, ignora este correo y asegúrate de que tu cuenta esté segura.
            </div>
            
            <p>Después de verificar el código, podrás establecer una nueva contraseña.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Habit Manager. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
