import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Habit } from '../entities/habit.entity';
import { HabitLog } from '../entities/habit-log.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Notification,
      User,
      Habit,
      HabitLog,
      UserSettings,
      LoginAttempt,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }