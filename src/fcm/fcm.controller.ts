// src/fcm/fcm.controller.ts

import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { FcmService } from './fcm.service';
import { UnregisterDeviceTokenDto } from './dto/nregister-device-token.dto';

@Controller('fcm')
@UseGuards(JwtAuthGuard)
export class FcmController {
  constructor(private readonly fcmService: FcmService) { }

  /**
   * POST /fcm/register
   * Registrar token FCM del dispositivo del usuario
   */
  @Post('register')
  async registerToken(
    @Request() req,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const deviceToken = await this.fcmService.registerDeviceToken(
      req.user.id,
      dto.token,
      dto.deviceType || 'unknown',
      dto.deviceName,
    );

    return {
      message: 'Token registrado exitosamente',
      deviceToken: {
        id: deviceToken.id,
        deviceType: deviceToken.deviceType,
        deviceName: deviceToken.deviceName,
      },
    };
  }

  /**
   * DELETE /fcm/unregister
   * Desactivar token FCM (logout del dispositivo)
   */
  @Delete('unregister')
  async unregisterToken(@Body() dto: UnregisterDeviceTokenDto) {
    await this.fcmService.unregisterDeviceToken(dto.token);

    return {
      message: 'Token desactivado exitosamente',
    };
  }
}