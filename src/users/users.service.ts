import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private settingsRepository: Repository<UserSettings>,
  ) { }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferredLanguage', 'settings'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }

    if (updateProfileDto.preferredLanguageId) {
      user.preferredLanguage = {
        id: updateProfileDto.preferredLanguageId,
      } as any;
    }

    if (updateProfileDto.profilePicture !== undefined) {
      user.profilePicture = updateProfileDto.profilePicture;
    }

    await this.userRepository.save(user);

    return this.getProfile(userId);
  }

  async getSettings(userId: number) {
    const settings = await this.settingsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      throw new NotFoundException('Configuración no encontrada');
    }

    return settings;
  }

  async updateSettings(userId: number, updateSettingsDto: UpdateSettingsDto) {
    const settings = await this.settingsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      throw new NotFoundException('Configuración no encontrada');
    }

    Object.assign(settings, updateSettingsDto);

    return await this.settingsRepository.save(settings);
  }

  async deleteAccount(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);

    return { message: 'Cuenta eliminada correctamente' };
  }
}