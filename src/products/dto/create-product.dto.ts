import { IsString, IsInt, IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsInt()
  quantity: number;

  @IsNumber()
  price: number;

  @IsString()
  location: string;

  @IsDate()
  availableFrom: Date;

  @IsDate()
  availableTo: Date;

  @IsString()
  image: string;

  @IsString()
  @IsOptional()
  description?: string;
}