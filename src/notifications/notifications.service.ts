import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { Habit } from '../entities/habit.entity';
import { HabitLog } from '../entities/habit-log.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';

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
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
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
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );

    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  // Crear notificación
  async createNotification(
    userId: number,
    title: string,
    message: string,
    scheduledAt?: Date,
  ) {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      title,
      message,
      scheduledAt: scheduledAt || new Date(),
    });

    return await this.notificationRepository.save(notification);
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

  // Recordatorios diarios
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyReminders() {
    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const reminderTime = user.settings.reminderTime || '08:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);

      const now = new Date();
      const reminderDate = new Date(now);
      reminderDate.setHours(hours, minutes, 0, 0);

      // Solo enviar si es la hora del recordatorio
      if (Math.abs(now.getTime() - reminderDate.getTime()) < 60000) { // 1 minuto de tolerancia
        const habits = await this.habitRepository.find({
          where: { user: { id: user.id }, isActive: true },
        });

        if (habits.length > 0) {
          await this.createNotification(
            user.id,
            '¡Hora de tus hábitos!',
            `Tienes ${habits.length} hábito(s) pendiente(s) hoy. ¡No olvides completarlos!`,
            reminderDate,
          );
        }
      }
    }
  }

  // Mensajes motivacionales diarios
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendMotivationalMessages() {
    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.notificationEnabled) continue;

      const message = this.getRandomMotivationalMessage();
      await this.createNotification(
        user.id,
        'Mensaje motivacional del día',
        message,
        new Date(),
      );
    }
  }

  // Notificaciones de rachas y logros
  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async checkStreaksAndAchievements() {
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
          (log) => log.logDate.getTime() === today.getTime(),
        );

        if (todayLog?.completed) {
          // Calcular racha actual
          const sortedLogs = habit.logs
            .filter((log) => log.completed)
            .sort((a, b) => b.logDate.getTime() - a.logDate.getTime());

          let currentStreak = 0;
          let expectedDate = new Date(today);

          for (const log of sortedLogs) {
            if (log.logDate.getTime() === expectedDate.getTime()) {
              currentStreak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
              break;
            }
          }

          // Notificar rachas importantes
          if (currentStreak === 3) {
            await this.createNotification(
              user.id,
              '¡Nueva racha!',
              `¡Felicitaciones! Has completado "${habit.title}" por 3 días consecutivos.`,
            );
          } else if (currentStreak === 7) {
            await this.createNotification(
              user.id,
              '¡Semana completa!',
              `¡Increíble! Has mantenido "${habit.title}" por una semana entera.`,
            );
          } else if (currentStreak === 30) {
            await this.createNotification(
              user.id,
              '¡Mes completo!',
              `¡Fantástico! Has completado "${habit.title}" todos los días de este mes.`,
            );
          }
        }
      }
    }
  }

  // Notificaciones de seguridad
  async checkFailedLoginAttempts() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Obtener usuarios con múltiples intentos fallidos en la última hora
    const usersWithFailedAttempts = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.loginAttempts', 'attempt')
      .where('attempt.success = :success', { success: false })
      .andWhere('attempt.attemptedAt > :oneHourAgo', { oneHourAgo })
      .groupBy('user.id')
      .having('COUNT(attempt.id) >= :count', { count: 3 })
      .getMany();

    for (const user of usersWithFailedAttempts) {
      const settings = await this.userSettingsRepository.findOne({
        where: { user: { id: user.id } },
      });

      if (settings?.notificationEnabled) {
        await this.createNotification(
          user.id,
          '⚠️ Actividad sospechosa detectada',
          'Se han detectado múltiples intentos fallidos de inicio de sesión en tu cuenta. Si no fuiste tú, cambia tu contraseña inmediatamente.',
        );
      }
    }
  }

  // Resúmenes semanales
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklySummaries() {
    const users = await this.userRepository.find({
      relations: ['settings'],
      where: { isActive: true },
    });

    for (const user of users) {
      if (!user.settings?.weeklySummary) continue;

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
          (log) => log.logDate >= weekAgo && log.completed,
        );
        totalCompleted += weeklyLogs.length;
      }

      const completionRate = totalHabits > 0 ? (totalCompleted / (totalHabits * 7)) * 100 : 0;

      await this.createNotification(
        user.id,
        '📊 Resumen semanal',
        `Esta semana completaste ${totalCompleted} hábitos de un total posible de ${totalHabits * 7}. Tasa de completitud: ${completionRate.toFixed(1)}%. ¡Sigue así!`,
      );
    }
  }

  // Limpiar notificaciones antiguas
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldNotifications() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    await this.notificationRepository.delete({
      scheduledAt: LessThan(twoWeeksAgo),
      isRead: true,
    });
  }
}