// src/notifications/notifications.service.ts (ACTUALIZADO)

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { Notification } from '../entities/notification.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { FcmService } from '../fcm/fcm.service'; // ⬅️ NUEVO

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private habitLogRepository: Repository<HabitLog>,
    private fcmService: FcmService, // ⬅️ NUEVO
  ) { }

  async getUserNotifications(userId: number, unreadOnly: boolean = false) {
    const where: any = { user: { id: userId } };

    if (unreadOnly) {
      where.isRead = false;
    }

    return await this.notificationRepository.find({
      where,
      order: { scheduledAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    const result = await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );

    return {
      message: 'Todas las notificaciones marcadas como leídas',
      markedCount: result.affected || 0,
    };
  }

  // ⬇️ MÉTODO ACTUALIZADO: Crear notificación Y enviar push
  async createNotification(
    userId: number,
    title: string,
    message: string,
    scheduledAt?: Date,
    sendPush: boolean = true, // ⬅️ NUEVO parámetro
  ) {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      title,
      message,
      scheduledAt: scheduledAt || new Date(),
      sentAt: new Date(),
    });

    const saved = await this.notificationRepository.save(notification);

    // ⬇️ NUEVO: Enviar push notification automáticamente
    if (sendPush) {
      try {
        await this.fcmService.sendPushForNotification(saved.id);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    return saved;
  }

  // Mensajes motivacionales
  private getRandomMotivationalMessage(): string {
    const messages = [
      '¡Recuerda que cada pequeño paso cuenta! Sigue adelante.',
      'La consistencia es la clave del éxito. ¡Tú puedes!',
      'Hoy es un día perfecto para crear nuevos hábitos.',
      'Cada día es una nueva oportunidad para ser mejor.',
      '¡No te rindas! Los hábitos se construyen con perseverancia.',
      'Celebra tus victorias diarias, por pequeñas que sean.',
      'La motivación viene de la acción, ¡empieza ahora!',
      'Tú eres más fuerte de lo que crees. ¡Sigue adelante!',
      'Los hábitos poderosos se construyen día a día.',
      '¡Felicitaciones por cuidar de ti mismo hoy!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ⬇️ CRON JOB ACTUALIZADO: Recordatorios diarios con push
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyReminders() {
    console.log('🔔 Ejecutando cron: recordatorios diarios...');

    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const habits = await this.habitRepository.find({
        where: { user: { id: user.id }, isActive: true },
      });

      if (habits.length > 0) {
        await this.createNotification(
          user.id,
          '¡Hora de tus hábitos! 🎯',
          `Tienes ${habits.length} hábito(s) pendiente(s) hoy. ¡No olvides completarlos!`,
          new Date(),
          true, // ⬅️ Enviar push
        );
      }
    }

    console.log('✅ Recordatorios diarios enviados');
  }

  // ⬇️ CRON JOB ACTUALIZADO: Mensajes motivacionales con push
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendMotivationalMessages() {
    console.log('💪 Ejecutando cron: mensajes motivacionales...');

    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const message = this.getRandomMotivationalMessage();
      await this.createNotification(
        user.id,
        'Mensaje motivacional del día ✨',
        message,
        new Date(),
        true, // ⬅️ Enviar push
      );
    }

    console.log('✅ Mensajes motivacionales enviados');
  }

  // ⬇️ NUEVO: Recordatorios nocturnos a las 9:10 PM con push
  @Cron('10 21 * * *')
  async sendEveningReminders() {
    console.log('🌙 Ejecutando cron: recordatorios nocturnos...');

    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const message = this.getRandomMotivationalMessage();
      await this.createNotification(
        user.id,
        'Buenas noches 🌙',
        `Antes de dormir, reflexiona: ${message}`,
        new Date(),
        true, // ⬅️ Enviar push
      );
    }

    console.log('✅ Recordatorios nocturnos enviados');
  }

  // ⬇️ CRON JOB ACTUALIZADO: Notificaciones de rachas con push
  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async checkStreaksAndAchievements() {
    console.log('🏆 Ejecutando cron: verificando rachas y logros...');

    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const habits = await this.habitRepository.find({
        where: { user: { id: user.id }, isActive: true },
        relations: ['logs'],
      });

      for (const habit of habits) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayLog = habit.logs.find(
          (log) => new Date(log.logDate).getTime() === today.getTime(),
        );

        if (todayLog?.completed) {
          // Calcular racha actual
          const sortedLogs = habit.logs
            .filter((log) => log.completed)
            .sort((a, b) => b.logDate.getTime() - a.logDate.getTime());

          let currentStreak = 0;
          let expectedDate = new Date(today);

          for (const log of sortedLogs) {
            if (new Date(log.logDate).getTime() === expectedDate.getTime()) {
              currentStreak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
              break;
            }
          }

          // Notificar rachas importantes CON PUSH
          if (currentStreak === 3) {
            await this.createNotification(
              user.id,
              '🔥 ¡Nueva racha de 3 días!',
              `¡Felicitaciones! Has completado "${habit.title}" por 3 días consecutivos.`,
              new Date(),
              true, // ⬅️ Enviar push
            );
          } else if (currentStreak === 7) {
            await this.createNotification(
              user.id,
              '🎉 ¡Semana completa!',
              `¡Increíble! Has mantenido "${habit.title}" por una semana entera.`,
              new Date(),
              true, // ⬅️ Enviar push
            );
          } else if (currentStreak === 30) {
            await this.createNotification(
              user.id,
              '💎 ¡Mes completo!',
              `¡Fantástico! Has completado "${habit.title}" todos los días de este mes.`,
              new Date(),
              true, // ⬅️ Enviar push
            );
          }
        }
      }
    }

    console.log('✅ Verificación de rachas completada');
  }

  // ⬇️ CRON JOB ACTUALIZADO: Resúmenes semanales con push
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklySummaries() {
    console.log('📊 Ejecutando cron: resúmenes semanales...');

    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.weeklySummary || !user.settings?.notificationEnabled) continue;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const habits = await this.habitRepository.find({
        where: { user: { id: user.id }, isActive: true },
        relations: ['logs'],
      });

      let totalCompleted = 0;
      let totalHabits = habits.length;

      for (const habit of habits) {
        const weeklyLogs = habit.logs.filter(
          (log) => new Date(log.logDate) >= weekAgo && log.completed,
        );
        totalCompleted += weeklyLogs.length;
      }

      const completionRate = totalHabits > 0 ? (totalCompleted / (totalHabits * 7)) * 100 : 0;

      await this.createNotification(
        user.id,
        '📊 Resumen semanal',
        `Esta semana completaste ${totalCompleted} hábitos de un total posible de ${totalHabits * 7}. Tasa de completitud: ${completionRate.toFixed(1)}%. ¡Sigue así!`,
        new Date(),
        true, // ⬅️ Enviar push
      );
    }

    console.log('✅ Resúmenes semanales enviados');
  }

  // ⬇️ NUEVO: Cron job para reenviar notificaciones push fallidas
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedPushNotifications() {
    console.log('🔄 Ejecutando cron: reintentando notificaciones push fallidas...');

    // Buscar notificaciones de las últimas 24 horas que no se enviaron
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const failedNotifications = await this.notificationRepository.find({
      where: {
        pushSent: false,
        scheduledAt: LessThan(new Date()),
        sentAt: LessThan(new Date()),
      },
      relations: ['user'],
      take: 50, // Limitar a 50 por ejecución
    });

    for (const notification of failedNotifications) {
      try {
        await this.fcmService.sendPushForNotification(notification.id);
      } catch (error) {
        console.error(`Error reintentando push para notificación ${notification.id}:`, error);
      }
    }

    console.log(`✅ Reintentos completados: ${failedNotifications.length} notificaciones procesadas`);
  }

  // Limpiar notificaciones antiguas
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldNotifications() {
    console.log('🧹 Ejecutando cron: limpieza de notificaciones antiguas...');

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const result = await this.notificationRepository.delete({
      scheduledAt: LessThan(twoWeeksAgo),
      isRead: true,
    });

    console.log(`✅ Limpiadas ${result.affected || 0} notificaciones antiguas`);
  }
}