import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Habit } from '../entities/habit.entity';
import { HabitLog } from '../entities/habit-log.entity';
import { UserSettings } from '../entities/user-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      Habit,
      HabitLog,
      UserSettings,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }