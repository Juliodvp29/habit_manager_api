import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiRecommendation } from '../entities/ai-recommendation.entity';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { User } from '../entities/user.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habit, HabitLog, AiRecommendation, User]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule { }