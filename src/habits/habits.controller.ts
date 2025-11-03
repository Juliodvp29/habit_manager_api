import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHabitDto } from './dto/create-habit.dto';
import { LogHabitDto } from './dto/log-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitsService } from './habits.service';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@ApiTags('habits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) { }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo hábito',
    description: 'Crea un nuevo hábito para el usuario autenticado',
  })
  @ApiResponse({
    status: 201,
    description: 'Hábito creado exitosamente',
    schema: {
      example: {
        id: 1,
        title: 'Hacer ejercicio',
        description: '30 minutos de cardio',
        frequency: 'daily',
        targetCount: 1,
        isActive: true,
        startDate: '2025-01-15',
        createdAt: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  create(@Request() req, @Body() createHabitDto: CreateHabitDto) {
    return this.habitsService.create(req.user.id, createHabitDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los hábitos',
    description: 'Obtiene todos los hábitos del usuario autenticado',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de hábitos obtenida exitosamente',
  })

  @Get()
  findAll(@Request() req, @Query() pagination: PaginationDto) {
    return this.habitsService.findAll(req.user.id, pagination);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard de hábitos',
    description: 'Obtiene un resumen de todos los hábitos con estadísticas del día actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard obtenido exitosamente',
    schema: {
      example: [
        {
          id: 1,
          title: 'Hacer ejercicio',
          todayCompleted: true,
          todayProgress: 1,
          currentStreak: 5,
        },
      ],
    },
  })
  getDashboard(@Request() req) {
    return this.habitsService.getDashboard(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener hábito por ID',
    description: 'Obtiene los detalles de un hábito específico',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del hábito',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Hábito encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Hábito no encontrado',
  })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.habitsService.findOne(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Estadísticas del hábito',
    description: 'Obtiene estadísticas detalladas de un hábito en un período de tiempo',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del hábito',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Número de días a analizar (por defecto: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas',
    schema: {
      example: {
        habitId: 1,
        habitTitle: 'Hacer ejercicio',
        totalDays: 30,
        completedDays: 25,
        completionRate: 83,
        currentStreak: 5,
      },
    },
  })
  getStats(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days?: number,
  ) {
    return this.habitsService.getStats(id, req.user.id, days || 30);
  }

  @Post(':id/log')
  @ApiOperation({
    summary: 'Registrar progreso del hábito',
    description: 'Registra el progreso diario de un hábito',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del hábito',
  })
  @ApiResponse({
    status: 201,
    description: 'Progreso registrado exitosamente',
  })
  logProgress(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() logHabitDto: LogHabitDto,
  ) {
    return this.habitsService.logProgress(id, req.user.id, logHabitDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar hábito',
    description: 'Actualiza los datos de un hábito existente',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del hábito',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Hábito actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Hábito no encontrado',
  })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, req.user.id, updateHabitDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar hábito',
    description: 'Elimina permanentemente un hábito y todos sus registros',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del hábito',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Hábito eliminado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Hábito no encontrado',
  })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.habitsService.remove(id, req.user.id);
  }
}