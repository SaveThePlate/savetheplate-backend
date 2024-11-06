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

  @IsNotEmpty()
  expirationDate: string;

  @IsNotEmpty()
  @IsString()

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
