import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Habit } from './habit.entity';
import { Language } from './language.entity';
import { UserSettings } from './user-settings.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  profilePicture: string;

  @ManyToOne(() => Language, { nullable: true })
  @JoinColumn({ name: 'preferred_language_id' })
  preferredLanguage: Language;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Habit[];

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;
}