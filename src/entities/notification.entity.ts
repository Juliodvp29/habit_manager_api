// src/entities/notification.entity.ts (ACTUALIZADO)

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'boolean', default: false, name: 'push_sent' })
  pushSent: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'push_sent_at' })
  pushSentAt: Date;

  @Column({ type: 'text', nullable: true, name: 'push_error' })
  pushError: string;
}