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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario y envía un código de verificación por email',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente. Se requiere verificación de email.',
    schema: {
      example: {
        message: 'Usuario registrado. Por favor verifica tu email.',
        user: {
          id: 1,
          email: 'usuario@example.com',
          fullName: 'Juan Pérez',
          isEmailVerified: false,
          isActive: true,
          createdAt: '2025-01-15T10:30:00.000Z',
        },
        emailSent: true,
        requiresVerification: true,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      example1: {
        summary: 'Registro completo',
        value: {
          email: 'usuario@example.com',
          password: 'Password123!',
          fullName: 'Juan Pérez',
        },
      },
    },
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario y retorna tokens JWT. Puede requerir 2FA en casos sospechosos.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Login estándar',
        value: {
          email: 'usuario@example.com',
          password: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso - Tokens generados',
    schema: {
      example: {
        user: {
          id: 1,
          email: 'usuario@example.com',
          fullName: 'Juan Pérez',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Login exitoso',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '2FA requerido - Se envió código por email',
    schema: {
      example: {
        requires2FA: true,
        message:
          'Se ha detectado un inicio de sesión inusual. Se ha enviado un código de verificación a tu email',
        userId: 1,
        email: 'u****o@example.com',
        reason: 'security_check',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o email no verificado',
  })
  login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('verify-2fa')
  @ApiOperation({
    summary: 'Verificar código 2FA',
    description: 'Verifica el código de autenticación de dos factores y retorna tokens',
  })
  @ApiBody({
    type: Verify2FADto,
    examples: {
      example1: {
        summary: 'Verificación 2FA',
        value: {
          userId: 1,
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado - Tokens generados',
  })
  @ApiResponse({
    status: 401,
    description: 'Código 2FA inválido o expirado',
  })
  verify2FA(
    @Body() verify2FADto: Verify2FADto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.verify2FA(verify2FADto, ip, userAgent);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar access token',
    description: 'Genera un nuevo access token usando un refresh token válido',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Token renovado',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  refreshToken(@Body() body: RefreshTokenDto & { userId?: number }, @Request() req) {
    const userId = req.user?.id || body.userId;

    if (!userId) {
      throw new BadRequestException('userId requerido');
    }

    if (!body.refreshToken) {
      throw new BadRequestException('refreshToken requerido');
    }

    return this.authService.refreshAccessToken(userId, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca el refresh token del usuario',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Logout',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    schema: {
      example: {
        message: 'Logout exitoso',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido',
  })
  logout(@Request() req, @Body() body: RefreshTokenDto) {
    if (!body.refreshToken) {
      throw new BadRequestException('refreshToken requerido');
    }

    return this.authService.logout(req.user.id, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna la información completa del perfil del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    schema: {
      example: {
        id: 1,
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        isEmailVerified: true,
        isActive: true,
        createdAt: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}