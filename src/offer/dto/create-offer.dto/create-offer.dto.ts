import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  expirationDate: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @IsArray()
  @IsNotEmpty()
  images: string;

}
