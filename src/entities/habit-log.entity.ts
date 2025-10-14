import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Habit } from './habit.entity';

@Entity('habit_logs')
@Unique(['habit', 'logDate'])
export class HabitLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Habit, (habit) => habit.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Habit;

  @Column({ type: 'date', name: 'log_date' })
  logDate: Date;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'varchar', length: 20, default: 'synced', name: 'sync_status' })
  syncStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}