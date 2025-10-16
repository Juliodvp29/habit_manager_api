// src/fcm/fcm.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from '../entities/device-token.entity';
import { Notification } from '../entities/notification.entity';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, Notification])],
  controllers: [FcmController],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule { }