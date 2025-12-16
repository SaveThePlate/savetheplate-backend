import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleAuthService {
  constructor(private readonly usersService: UsersService) {}

  async loginWithGoogle(user: any) {
      // Try to find user by googleId first
      let dbUser = await this.usersService.findOneByGoogleId(user.googleId);
    
      // If not found, try by email
      if (!dbUser) {
        dbUser = await this.usersService.findOne(user.email);
      }
    
      // If still not found, create the user
      if (!dbUser) {
        dbUser = await this.usersService.create({
          email: user.email,
          googleId: user.googleId,
          username: user.firstName + " " + user.lastName,
          role: 'NONE', // default role
        });
      }
    
      // Generate JWT
      const token = this.jwtService.sign({
        sub: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      });
    
      return token;
    }

}
