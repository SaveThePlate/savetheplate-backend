import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRatingDto {
  @IsNotEmpty({ message: 'Order ID is required' })
  @IsNumber({}, { message: 'Order ID must be a number' })
  @Type(() => Number)
  orderId: number;

  @IsNotEmpty({ message: 'Provider ID is required' })
  @IsNumber({}, { message: 'Provider ID must be a number' })
  @Type(() => Number)
  providerId: number;

  @IsNotEmpty({ message: 'Rating is required' })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;
}

