import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // ⚠️ IMPORTANTE: Rechazar refresh tokens en rutas protegidas
    if (payload.type === 'refresh') {
      throw new UnauthorizedException(
        'Use /auth/refresh endpoint to get a new access token',
      );
    }

    // Asegurarse que sea un access token o un token antiguo (por compatibilidad)
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['preferredLanguage'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return user;
  }
}