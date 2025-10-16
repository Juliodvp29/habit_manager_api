import { IsIn, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  deviceType?: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  deviceName?: string;
}

