import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Get('analyze/:habitId')
  analyzeHabit(
    @Request() req,
    @Param('habitId', ParseIntPipe) habitId: number,
  ) {
    return this.aiService.analyzeHabitPattern(habitId, req.user.id);
  }

  @Post('recommend/:habitId')
  generateRecommendation(
    @Request() req,
    @Param('habitId', ParseIntPipe) habitId: number,
  ) {
    return this.aiService.generateRecommendation(habitId, req.user.id);
  }

  @Get('motivational')
  getMotivationalMessage(@Request() req) {
    return this.aiService.generateMotivationalMessage(req.user.id);
  }

  @Get('suggestions')
  getSuggestions(@Request() req) {
    return this.aiService.getSuggestions(req.user.id);
  }

  @Get('recommendations')
  getRecommendationHistory(@Request() req, @Query('limit') limit?: number) {
    return this.aiService.getRecommendationHistory(req.user.id, limit || 10);
  }
}