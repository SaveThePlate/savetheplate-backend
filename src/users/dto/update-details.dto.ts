import { IsString, IsNumber } from 'class-validator';

export class UpdateDetailsDto {
  @IsString()
  location: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  phoneNumber: number;

}
