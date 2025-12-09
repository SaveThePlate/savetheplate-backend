import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

enum FoodType {
  snack = 'snack',
  meal = 'meal',
  beverage = 'beverage',
  other = 'other',
}

enum Taste {
  sweet = 'sweet',
  salty = 'salty',
  both = 'both',
  neutral = 'neutral',
}

export class CreateOfferDto {
  // ownerId is set from the authenticated user, not from the request body
  // So we don't validate it here

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsNotEmpty()
  images: string;

  @IsOptional()
  @IsEnum(FoodType)
  foodType?: FoodType;

  @IsOptional()
  @IsEnum(Taste)
  taste?: Taste;
}
