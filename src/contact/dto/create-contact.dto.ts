import { IsString, IsEmail, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  userRole?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;
}

