import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RapidOfferDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  pickupStartTime: string;
}
