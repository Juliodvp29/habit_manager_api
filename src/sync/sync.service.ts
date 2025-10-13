import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { SyncDataDto } from './dto/sync-habits.dto';

export interface SyncResultItem {
  localId?: string;
  serverId: number;
}

export interface HabitConflict extends SyncResultItem {
  serverData: Habit;
}

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private logRepository: Repository<HabitLog>,
    @InjectRepository(UserSettings)
    private settingsRepository: Repository<UserSettings>,
  ) { }

  async syncData(userId: number, syncData: SyncDataDto) {
    const { habits, logs, lastSyncAt } = syncData;

    const syncResult: {
      habits: {
        created: SyncResultItem[];
        updated: SyncResultItem[];
        conflicts: HabitConflict[];
      };
      logs: {
        created: SyncResultItem[];
        updated: SyncResultItem[];
        conflicts: never[];
      };
      serverChanges: {
        habits: Habit[];
        logs: HabitLog[];
      };
    } = {
      habits: {
        created: [],
        updated: [],
        conflicts: [],
      },
      logs: {
        created: [],
        updated: [],
        conflicts: [],
      },
      serverChanges: {
        habits: [],
        logs: [],
      },
    };

    // Sincronizar hábitos del cliente al servidor
    if (habits && habits.length > 0) {
      for (const habitData of habits) {
        try {
          if (habitData.deleted) {
            // Eliminar hábito
            if (habitData.id) {
              await this.habitRepository.delete({
                id: habitData.id,
                user: { id: userId },
              });
            }
          } else if (habitData.id) {
            // Actualizar hábito existente
            const existingHabit = await this.habitRepository.findOne({
              where: { id: habitData.id, user: { id: userId } },
            });

            if (existingHabit) {
              // Verificar conflicto (si el servidor tiene una versión más reciente)
              if (
                existingHabit.updatedAt > new Date(habitData.updatedAt)
              ) {
                syncResult.habits.conflicts.push({
                  localId: habitData.localId,
                  serverId: habitData.id,
                  serverData: existingHabit,
                });
              } else {
                Object.assign(existingHabit, {
                  title: habitData.title,
                  description: habitData.description,
                  frequency: habitData.frequency,
                  targetCount: habitData.targetCount,
                  isActive: habitData.isActive,
                  lastSyncedAt: new Date(),
                });
                const updated = await this.habitRepository.save(existingHabit);
                syncResult.habits.updated.push({
                  localId: habitData.localId,
                  serverId: updated.id,
                });
              }
            }
          } else {
            // Crear nuevo hábito
            const newHabit = this.habitRepository.create({
              ...habitData,
              user: { id: userId },
              lastSyncedAt: new Date(),
            });
            const created = await this.habitRepository.save(newHabit);
            syncResult.habits.created.push({
              localId: habitData.localId,
              serverId: created.id,
            });
          }
        } catch (error) {
          console.error('Error syncing habit:', error);
        }
      }
    }

    // Sincronizar logs del cliente al servidor
    if (logs && logs.length > 0) {
      for (const logData of logs) {
        try {
          if (logData.deleted) {
            // Eliminar log
            if (logData.id) {
              await this.logRepository.delete({ id: logData.id });
            }
          } else if (logData.id) {
            // Actualizar log existente
            const existingLog = await this.logRepository.findOne({
              where: { id: logData.id },
              relations: ['habit'],
            });

            if (existingLog && existingLog.habit.user.id === userId) {
              Object.assign(existingLog, {
                progress: logData.progress,
                notes: logData.notes,
                completed: logData.completed,
              });
              await this.logRepository.save(existingLog);
              syncResult.logs.updated.push({
                localId: logData.localId,
                serverId: existingLog.id,
              });
            }
          } else {
            // Crear nuevo log
            const habitId = logData.habitId || null;

            if (habitId) {
              const habit = await this.habitRepository.findOne({
                where: { id: habitId, user: { id: userId } },
              });

              if (habit) {
                const newLog = this.logRepository.create({
                  habit,
                  logDate: new Date(logData.logDate),
                  progress: logData.progress,
                  notes: logData.notes,
                  completed: logData.completed,
                  syncStatus: 'synced',
                });

                const created = await this.logRepository.save(newLog);
                syncResult.logs.created.push({
                  localId: logData.localId,
                  serverId: created.id,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error syncing log:', error);
        }
      }
    }

    // Obtener cambios del servidor desde la última sincronización
    if (lastSyncAt) {
      const serverHabits = await this.habitRepository.find({
        where: {
          user: { id: userId },
          updatedAt: MoreThan(new Date(lastSyncAt)),
        },
      });

      const serverLogs = await this.logRepository.find({
        where: {
          createdAt: MoreThan(new Date(lastSyncAt)),
        },
        relations: ['habit'],
      });

      syncResult.serverChanges.habits = serverHabits.filter(
        (h) => h.user.id === userId,
      );
      syncResult.serverChanges.logs = serverLogs.filter(
        (l) => l.habit?.user?.id === userId,
      );
    }

    // Actualizar última sincronización
    await this.settingsRepository.update(
      { user: { id: userId } },
      { lastSyncAt: new Date() },
    );

    return {
      success: true,
      syncResult,
      serverTimestamp: new Date(),
    };
  }

  async getServerData(userId: number, lastSyncAt?: Date) {
    const query: any = { user: { id: userId } };

    if (lastSyncAt) {
      query.updatedAt = MoreThan(new Date(lastSyncAt));
    }

    const habits = await this.habitRepository.find({
      where: query,
      order: { updatedAt: 'DESC' },
    });

    const logs = await this.logRepository.find({
      where: {
        habit: { user: { id: userId } },
        ...(lastSyncAt && { createdAt: MoreThan(new Date(lastSyncAt)) }),
      },
      relations: ['habit'],
      order: { createdAt: 'DESC' },
    });

    return {
      habits,
      logs,
      serverTimestamp: new Date(),
    };
  }
}