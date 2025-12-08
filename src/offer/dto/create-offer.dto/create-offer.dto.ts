import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateOfferDto {
  // ownerId is set from the authenticated user, not from the request body
  // So we don't validate it here

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  expirationDate: string;

  @IsOptional()
  pickupStartTime?: string;

  @IsOptional()
  pickupEndTime?: string;

  @IsOptional()
  @IsString()
  mapsLink?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsNotEmpty()
  images: string;
}
