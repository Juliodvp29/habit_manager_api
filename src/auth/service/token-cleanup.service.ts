import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class TokenCleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  // Ejecutar diariamente a las 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.refreshTokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      console.log(`🧹 Limpiados ${result.affected} tokens expirados`);
    } catch (error) {
      console.error('Error limpiando tokens expirados:', error);
    }
  }

  // Ejecutar cada semana para limpiar tokens revocados
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupRevokedTokens(): Promise<void> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const result = await this.refreshTokenRepository.delete({
        revoked: true,
        createdAt: LessThan(weekAgo),
      });
      console.log(`🧹 Limpiados ${result.affected} tokens revocados`);
    } catch (error) {
      console.error('Error limpiando tokens revocados:', error);
    }
  }
}