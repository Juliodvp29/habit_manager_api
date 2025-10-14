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

  // ⬇️ AGREGAR name: 'password_hash'
  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  // ⬇️ AGREGAR name: 'full_name'
  @Column({ type: 'varchar', length: 150, nullable: true, name: 'full_name' })
  fullName: string;

  // ⬇️ AGREGAR name: 'profile_picture'
  @Column({ type: 'text', nullable: true, name: 'profile_picture' })
  profilePicture: string;

  @ManyToOne(() => Language, { nullable: true })
  @JoinColumn({ name: 'preferred_language_id' })
  preferredLanguage: Language;

  // ⬇️ AGREGAR name: 'is_email_verified'
  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  // ⬇️ AGREGAR name: 'email_verified_at'
  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt: Date;

  // ⬇️ AGREGAR name: 'is_active'
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // ⬇️ AGREGAR name: 'created_at'
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ⬇️ AGREGAR name: 'updated_at'
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Habit[];

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;
}