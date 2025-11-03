// src/app.module.ts (ACTUALIZADO)

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { FcmModule } from './fcm/fcm.module'; // ⬅️ NUEVO
import { HabitsModule } from './habits/habits.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SyncModule } from './sync/sync.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, ThrottlerModule.forRoot([{
        ttl: 60000, // 1 minuto
        limit: 10,  // 10 requests
      }]),],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // ⚠️ Usar migraciones en producción
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HabitsModule,
    SyncModule,
    UsersModule,
    AiModule,
    NotificationsModule,
    EmailModule,
    VerificationModule,
    FcmModule, // ⬅️ NUEVO: Importar FcmModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }