import { IsString, IsNumber, IsInt } from 'class-validator';

export class UpdateDetailsDto {
  @IsString()
  location: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsInt()
  phoneNumber: number;

  @IsString()
  mapsLink: string;

}
