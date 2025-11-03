import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHabitDto {
  @ApiProperty({
    description: 'Título del hábito',
    example: 'Hacer ejercicio',
    maxLength: 150,
  })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional del hábito',
    example: '30 minutos de cardio',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Frecuencia del hábito',
    example: 'daily',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Objetivo de conteo diario',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetCount?: number;
}