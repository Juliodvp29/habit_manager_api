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
import { PaginationDto } from './habits.controller';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private logRepository: Repository<HabitLog>,
  ) { }

  /**
   * NUEVA FUNCIÓN: Normalizar fecha a string YYYY-MM-DD
   * Esto evita problemas de zona horaria
   */
  private getDateString(date?: Date | string): string {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.substring(0, 10);
    }

    const d = date ? (date instanceof Date ? date : new Date(date)) : new Date();

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * NUEVA FUNCIÓN: Comparar dos fechas ignorando la hora
   */
  private isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = this.getDateString(date1);
    const d2 = this.getDateString(date2);
    return d1 === d2;
  }

  async create(userId: number, createHabitDto: CreateHabitDto) {
    const habit = this.habitRepository.create({
      ...createHabitDto,
      user: { id: userId },
    });

    return await this.habitRepository.save(habit);
  }

  async findAll(userId: number, pagination: PaginationDto) {
    const defaultPage = 1;
    const defaultLimit = 10;

    // Coerce to numbers and provide sensible defaults if pagination or its fields are undefined
    const page = Number(pagination?.page ?? defaultPage) || defaultPage;
    const limit = Number(pagination?.limit ?? defaultLimit) || defaultLimit;

    const skip = (Math.max(1, page) - 1) * limit;

    const [habits, total] = await this.habitRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: habits,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    // ⭐ CORRECCIÓN: Usar string de fecha directamente
    const todayString = this.getDateString();
    console.log('📅 logProgress - Fecha de hoy (string):', todayString);

    // Buscar log del día usando query builder para mejor control
    let log = await this.logRepository
      .createQueryBuilder('log')
      .innerJoin('log.habit', 'habit')
      .where('habit.id = :habitId', { habitId })
      .andWhere('log.logDate = :logDate', { logDate: todayString })
      .getOne();

    if (!log) {
      // NUEVO LOG
      log = this.logRepository.create({
        habit,
        logDate: new Date(todayString), // Convertir string a Date
        progress: logHabitDto.progress,
        notes: logHabitDto.notes || null,
        completed: logHabitDto.progress >= habit.targetCount,
        syncStatus: 'synced',
      });
      console.log('✅ Creando nuevo log para:', todayString);
    } else {
      // ACTUALIZAR LOG EXISTENTE
      log.progress += logHabitDto.progress; // Acumular progreso
      log.notes = logHabitDto.notes || log.notes;
      log.completed = log.progress >= habit.targetCount;
      console.log('✅ Actualizando log existente. Progreso total:', log.progress);
    }

    const savedLog = await this.logRepository.save(log);

    return {
      id: savedLog.id,
      habitId: habit.id,
      logDate: this.getDateString(savedLog.logDate),
      progress: savedLog.progress,
      completed: savedLog.completed,
      notes: savedLog.notes,
      createdAt: savedLog.createdAt,
    };
  }

  async getStats(habitId: number, userId: number, days: number = 30) {
    const habit = await this.findOne(habitId, userId);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

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

    // ⭐ CORRECCIÓN: Usar string de fecha
    const todayString = this.getDateString();
    console.log('📅 Dashboard - Fecha de hoy (string):', todayString);

    const dashboard = habits.map((habit) => {
      console.log(`\n🔍 Analizando hábito "${habit.title}" (ID: ${habit.id})`);
      console.log(`   Total de logs: ${habit.logs.length}`);

      // Mostrar todos los logs para debug
      habit.logs.forEach((log, index) => {
        const logDateString = this.getDateString(log.logDate);
        console.log(`   Log ${index + 1}: ${logDateString} | Progress: ${log.progress} | Completed: ${log.completed}`);
        console.log(`      Raw logDate:`, log.logDate);
        console.log(`      Tipo de logDate:`, typeof log.logDate);
      });

      // Buscar el log de hoy usando comparación de strings
      const todayLog = habit.logs.find((log) => {
        const logDateString = this.getDateString(log.logDate);
        const isToday = this.isSameDay(logDateString, todayString);

        console.log(`   Comparando: "${logDateString}" === "${todayString}" ? ${isToday}`);

        if (isToday) {
          console.log(`✅ Hábito "${habit.title}" - Log encontrado:`, {
            logDate: logDateString,
            progress: log.progress,
            completed: log.completed
          });
        }

        return isToday;
      });

      if (!todayLog) {
        console.log(`❌ No se encontró log de hoy para "${habit.title}"`);
      }

      // Calcular racha correctamente
      const currentStreak = this.calculateStreak(habit.logs);

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
   * Calcular racha actual de un hábito
   */
  private calculateStreak(logs: HabitLog[]): number {
    if (!logs || logs.length === 0) return 0;

    // Obtener todos los logs completados y ordenarlos por fecha descendente
    const completedLogs = logs
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

    if (completedLogs.length === 0) return 0;

    const todayString = this.getDateString();
    const lastCompletedString = this.getDateString(completedLogs[0].logDate);

    // Calcular fecha de ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = this.getDateString(yesterday);

    let streak = 0;

    // Si el último completado es de hoy o ayer, iniciar racha en 1
    if (this.isSameDay(lastCompletedString, todayString) ||
      this.isSameDay(lastCompletedString, yesterdayString)) {
      streak = 1;
    } else {
      // Si es de antes de ayer, racha es 0
      return 0;
    }

    // Buscar días consecutivos anteriores
    let expectedDate = new Date(completedLogs[0].logDate);

    for (let i = 1; i < completedLogs.length; i++) {
      const logDate = new Date(completedLogs[i].logDate);

      expectedDate.setDate(expectedDate.getDate() - 1);

      if (this.isSameDay(logDate, expectedDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}