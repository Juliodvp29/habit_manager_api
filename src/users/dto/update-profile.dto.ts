import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsInt()
  preferredLanguageId?: number;

  @IsOptional()
  @IsUrl()
  profilePicture?: string;
}