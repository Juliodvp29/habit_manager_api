import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class LogHabitDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  notes?: string;
}