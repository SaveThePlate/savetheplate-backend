import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOfferDto {

  @IsNotEmpty()
  @IsString()
  ownerId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()

  @IsNotEmpty()
  @IsNumber()
  price: number;
  quantity: number;

  @IsNotEmpty()
  expirationDate: string;

  @IsNotEmpty()
  @IsString()
  mapsLink: string;

  @IsNotEmpty()
  @IsString()
  pickupLocation: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNotEmpty()
  images: string; 

}
