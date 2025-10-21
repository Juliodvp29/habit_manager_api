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

    // ⭐ CORRECCIÓN: Normalizar la fecha correctamente
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Usar UTC para evitar problemas de zona horaria

    // Buscar o crear log del día
    let log = await this.logRepository.findOne({
      where: {
        habit: { id: habitId },
        logDate: today,
      },
      relations: ['habit'],
    });

    if (!log) {
      // NUEVO LOG
      log = this.logRepository.create({
        habit,
        logDate: today,
        progress: logHabitDto.progress,
        notes: logHabitDto.notes || null,
        completed: logHabitDto.progress >= habit.targetCount,
        syncStatus: 'synced',
      });
      console.log('✅ Creando nuevo log para hoy:', today.toISOString());
    } else {
      // ACTUALIZAR LOG EXISTENTE
      log.progress += logHabitDto.progress; // ⭐ ACUMULAR progreso
      log.notes = logHabitDto.notes || log.notes;
      log.completed = log.progress >= habit.targetCount;
      console.log('✅ Actualizando log existente. Progreso:', log.progress);
    }

    const savedLog = await this.logRepository.save(log);

    // ⭐ IMPORTANTE: Devolver el log con toda la información
    return {
      id: savedLog.id,
      habitId: habit.id,
      logDate: savedLog.logDate,
      progress: savedLog.progress,
      completed: savedLog.completed,
      notes: savedLog.notes,
      createdAt: savedLog.createdAt,
    };
  }

  async getStats(habitId: number, userId: number, days: number = 30) {
    const habit = await this.findOne(habitId, userId);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

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

    // ⭐ CORRECCIÓN: Normalizar fecha para comparación
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    console.log('📅 Dashboard - Fecha de hoy (UTC):', today.toISOString());

    const dashboard = habits.map((habit) => {
      // Buscar el log de hoy normalizando las fechas
      const todayLog = habit.logs.find((log) => {
        const logDate = new Date(log.logDate);
        logDate.setUTCHours(0, 0, 0, 0);
        const logTime = logDate.getTime();

        const isToday = logTime === todayTime;

        if (isToday) {
          console.log(`✅ Hábito "${habit.title}" - Log encontrado:`, {
            logDate: logDate.toISOString(),
            progress: log.progress,
            completed: log.completed
          });
        }

        return isToday;
      });

      // ⭐ CORRECCIÓN: Calcular racha correctamente usando todos los logs del usuario
      const allLogs = habit.logs;
      const currentStreak = this.calculateStreak(allLogs);

      return {
        id: habit.id,
        title: habit.title,
        description: habit.description,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        isActive: habit.isActive,
        todayCompleted: todayLog?.completed || false,
        todayProgress: todayLog?.progress || 0,
        currentStreak,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      };
    });

    return dashboard;
  }

  /**
   * NUEVO: Calcular racha actual de un hábito
   */
  private calculateStreak(logs: HabitLog[]): number {
    if (!logs || logs.length === 0) return 0;

    // Obtener todos los logs completados y ordenarlos por fecha descendente
    const completedLogs = logs
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

    if (completedLogs.length === 0) return 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const lastCompletedDate = new Date(completedLogs[0].logDate);
    lastCompletedDate.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = 0;

    // Si el último completado es de hoy, iniciar racha en 1
    if (lastCompletedDate.getTime() === today.getTime()) {
      streak = 1;
    }
    // Si el último completado es de ayer, iniciar racha en 1
    else if (lastCompletedDate.getTime() === yesterday.getTime()) {
      streak = 1;
    }
    // Si es de antes, racha es 0
    else {
      return 0;
    }

    // Buscar días consecutivos anteriores al último completado
    for (let i = 1; i < completedLogs.length; i++) {
      const logDate = new Date(completedLogs[i].logDate);
      logDate.setUTCHours(0, 0, 0, 0);

      const expectedDate = new Date(lastCompletedDate);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}