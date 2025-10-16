
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmModule } from 'src/fcm/fcm.module';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { Notification } from '../entities/notification.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Notification,
      User,
      Habit,
      HabitLog,
      UserSettings,
    ]),
    FcmModule, // ⬅️ NUEVO: Importar FcmModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }