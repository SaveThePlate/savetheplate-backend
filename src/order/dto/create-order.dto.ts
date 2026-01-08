import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  // userId is optional in DTO as it comes from auth token
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @IsNotEmpty({ message: 'offerId is required' })
  @IsNumber({}, { message: 'offerId must be a number' })
  @Type(() => Number)
  offerId: number;

  @IsNotEmpty({ message: 'quantity is required' })
  @IsNumber({}, { message: 'quantity must be a number' })
  @Min(1, { message: 'quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;
}
