import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationCode } from '../entities/verification-code.entity';
import { User } from '../entities/user.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode, User, LoginAttempt]),
    EmailModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {

}
