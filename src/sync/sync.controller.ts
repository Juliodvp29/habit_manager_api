import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncDataDto } from './dto/sync-habits.dto';
import { SyncService, HabitConflict, SyncResultItem } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) { }

  @Post()
  syncData(@Request() req, @Body() syncData: SyncDataDto) {
    return this.syncService.syncData(req.user.id, syncData);
  }

  @Get('server-data')
  getServerData(@Request() req, @Query('lastSyncAt') lastSyncAt?: string) {
    const lastSync = lastSyncAt ? new Date(lastSyncAt) : undefined;
    return this.syncService.getServerData(req.user.id, lastSync);
  }
}