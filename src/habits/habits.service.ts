import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { LogHabitDto } from './dto/log-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private logRepository: Repository<HabitLog>,
  ) { }

  async create(userId: number, createHabitDto: CreateHabitDto) {
    const habit = this.habitRepository.create({
      ...createHabitDto,
      user: { id: userId },
    });

    return await this.habitRepository.save(habit);
  }

  async findAll(userId: number) {
    return await this.habitRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const habit = await this.habitRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['logs'],
    });

    if (!habit) {
      throw new NotFoundException('Hábito no encontrado');
    }

    return habit;
  }

  async update(id: number, userId: number, updateHabitDto: UpdateHabitDto) {
    const habit = await this.findOne(id, userId);

    Object.assign(habit, updateHabitDto);
    return await this.habitRepository.save(habit);
  }

  async remove(id: number, userId: number) {
    const habit = await this.findOne(id, userId);
    await this.habitRepository.remove(habit);
    return { message: 'Hábito eliminado correctamente' };
  }

  async logProgress(
    habitId: number,
    userId: number,
    logHabitDto: LogHabitDto,
  ) {
    const habit = await this.findOne(habitId, userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar o crear log del día
    let log = await this.logRepository.findOne({
      where: {
        habit: { id: habitId },
        logDate: today,
      },
    });

    if (!log) {
      log = this.logRepository.create({
        habit,
        logDate: today,
        progress: logHabitDto.progress,
        notes: logHabitDto.notes,
        completed: logHabitDto.progress >= habit.targetCount,
      });
    } else {
      log.progress = logHabitDto.progress;
      log.notes = logHabitDto.notes ?? null;
      log.completed = logHabitDto.progress >= habit.targetCount;
    }

    return await this.logRepository.save(log);
  }

  async getStats(habitId: number, userId: number, days: number = 30) {
    const habit = await this.findOne(habitId, userId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.logRepository.find({
      where: {
        habit: { id: habitId },
        logDate: Between(startDate, endDate),
      },
      order: { logDate: 'ASC' },
    });

    const totalDays = logs.length;
    const completedDays = logs.filter((log) => log.completed).length;
    const completionRate =
      totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    // Calcular racha actual
    let currentStreak = 0;
    const sortedLogs = [...logs].reverse();

    for (const log of sortedLogs) {
      if (log.completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      habitId,
      habitTitle: habit.title,
      totalDays,
      completedDays,
      completionRate: Math.round(completionRate),
      currentStreak,
      logs,
    };
  }

  async getDashboard(userId: number) {
    const habits = await this.habitRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['logs'],
      order: { createdAt: 'DESC' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dashboard = habits.map((habit) => {
      const todayLog = habit.logs.find(
        (log) => log.logDate.getTime() === today.getTime(),
      );

      return {
        id: habit.id,
        title: habit.title,
        description: habit.description,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        todayCompleted: todayLog?.completed || false,
        todayProgress: todayLog?.progress || 0,
      };
    });

    return dashboard;
  }
}