import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
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
}