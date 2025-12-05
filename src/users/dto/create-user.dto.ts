import { IsString, IsNotEmpty, IsInt } from 'class-validator';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Email ne peut pas être vide.' })
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsInt()
  @IsNotEmpty()
  phoneNumber: number;

  @IsString()
  @IsNotEmpty()
  profileImage: string;

  @IsString()
  mapsLink: string;
}
