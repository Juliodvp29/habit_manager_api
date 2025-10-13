import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, default: 'light' })
  theme: string;

  @Column({ type: 'boolean', default: true })
  notificationEnabled: boolean;

  @Column({ type: 'time', default: '08:00' })
  reminderTime: string;

  @Column({ type: 'boolean', default: true })
  weeklySummary: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;
}
