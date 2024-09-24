import { IsString, IsNotEmpty, IsDateString, IsArray, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsInt()
  @IsNotEmpty()
  phoneNumber: number;

  @IsString()
  @IsNotEmpty()
  profileImage: string;

}
