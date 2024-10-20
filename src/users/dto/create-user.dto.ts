import { IsString, IsNotEmpty, IsDateString, IsArray, IsInt, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Email ne peut pas être vide.' })
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  // @IsString()
  // @IsNotEmpty()
  // location: string;

  @IsInt()
  @IsNotEmpty()
  phoneNumber: number;

  @IsString()
  @IsNotEmpty()
  profileImage: string;

  // @IsNumber()
  // @IsNotEmpty()
  // longitude: number;

  // @IsNumber()
  // @IsNotEmpty()
  // latitude: number;


}
