import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SendAnnouncementDto {
  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  details?: string[];

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsString()
  buttonLink?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emails?: string[];

  @IsOptional()
  @IsBoolean()
  forceProduction?: boolean;

  @IsOptional()
  @IsString()
  language?: string;
}
