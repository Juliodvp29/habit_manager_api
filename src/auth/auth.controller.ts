import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * POST /auth/register
   * Registrar nuevo usuario
   */
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Login - retorna accessToken y refreshToken
   */
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  /**
   * POST /auth/verify-2fa
   * Verificar código 2FA y obtener tokens
   */
  @Post('verify-2fa')
  verify2FA(
    @Body() verify2FADto: Verify2FADto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.verify2FA(verify2FADto, ip, userAgent);
  }

  /**
   * POST /auth/refresh
   * Renovar access token usando refresh token
   * 
   * Body: { refreshToken: string }
   * Opcionalmente incluir userId si no viene en JWT
   */
  @Post('refresh')
  refreshToken(
    @Body() body: RefreshTokenDto & { userId?: number },
    @Request() req,
  ) {
    // Obtener userId del token JWT si existe, sino del body
    const userId = req.user?.id || body.userId;

    if (!userId) {
      throw new BadRequestException('userId requerido');
    }

    if (!body.refreshToken) {
      throw new BadRequestException('refreshToken requerido');
    }

    return this.authService.refreshAccessToken(userId, body.refreshToken);
  }

  /**
   * POST /auth/logout
   * Logout - revocar refresh token
   * Requiere: Bearer accessToken + refreshToken en body
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @Request() req,
    @Body() body: RefreshTokenDto,
  ) {
    if (!body.refreshToken) {
      throw new BadRequestException('refreshToken requerido');
    }

    return this.authService.logout(req.user.id, body.refreshToken);
  }

  /**
   * GET /auth/profile
   * Obtener perfil del usuario autenticado
   * Requiere: Bearer accessToken
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}