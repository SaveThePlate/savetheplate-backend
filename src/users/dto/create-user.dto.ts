export class CreateUserDto {
  id?: number;
  email: string;
  username?: string;
  location?: string;
  phoneNumber?: number;
  createdAt?: Date;
  profileImage?: string;

}
