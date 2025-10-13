import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

class HabitSyncData {
  id?: number;
  localId?: string;
  title: string;
  description?: string;
  frequency: string;
  targetCount: number;
  isActive: boolean;
  updatedAt: Date;
  deleted?: boolean;
}

class HabitLogSyncData {
  id?: number;
  localId?: string;
  habitId?: number;
  habitLocalId?: string;
  logDate: Date;
  progress: number;
  notes?: string;
  completed: boolean;
  updatedAt: Date;
  deleted?: boolean;
}

export class SyncDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitSyncData)
  @IsOptional()
  habits?: HabitSyncData[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitLogSyncData)
  @IsOptional()
  logs?: HabitLogSyncData[];

  lastSyncAt?: Date;
}