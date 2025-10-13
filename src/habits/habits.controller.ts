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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHabitDto } from './dto/create-habit.dto';
import { LogHabitDto } from './dto/log-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitsService } from './habits.service';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) { }

  @Post()
  create(@Request() req, @Body() createHabitDto: CreateHabitDto) {
    return this.habitsService.create(req.user.id, createHabitDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.habitsService.findAll(req.user.id);
  }

  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.habitsService.getDashboard(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.habitsService.findOne(id, req.user.id);
  }

  @Get(':id/stats')
  getStats(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days?: number,
  ) {
    return this.habitsService.getStats(id, req.user.id, days || 30);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, req.user.id, updateHabitDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.habitsService.remove(id, req.user.id);
  }

  @Post(':id/log')
  logProgress(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() logHabitDto: LogHabitDto,
  ) {
    return this.habitsService.logProgress(id, req.user.id, logHabitDto);
  }
}