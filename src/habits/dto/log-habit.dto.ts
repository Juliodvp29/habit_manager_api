import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogHabitDto {
  @ApiProperty({
    description: 'Progreso del hábito (0-100)',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({
    description: 'Notas opcionales sobre el progreso',
    example: 'Completé mi rutina de cardio',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}