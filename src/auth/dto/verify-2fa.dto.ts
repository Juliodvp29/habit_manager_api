import { IsInt, IsString, Length } from 'class-validator';

export class Verify2FADto {
  @IsInt()
  userId: number;

  @IsString()
  @Length(6, 6)
  code: string;
}