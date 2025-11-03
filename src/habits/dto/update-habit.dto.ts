import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { CreateHabitDto } from './create-habit.dto';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del hábito',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del hábito',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
}