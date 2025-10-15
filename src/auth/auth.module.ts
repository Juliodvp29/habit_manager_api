import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationModule } from 'src/verification/verification.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSettings,
      LoginAttempt,
      RefreshToken, // ← AGREGADO
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '30d'),
        },
      }),
      inject: [ConfigService],
    }),
    VerificationModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }