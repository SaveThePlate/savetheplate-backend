import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { access } from 'fs';
import { JwtType } from 'src/utils/jwt';


@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithGoogle(googleUser: any): Promise<string> {
    if (!googleUser?.email || !googleUser?.googleId) {
      throw new UnauthorizedException('Invalid Google user payload');
    }

    const user = await this.userService.findOrCreateGoogleUser({
      email: googleUser.email,
      googleId: googleUser.id,
    });

    return this.jwtService.sign(
      {
        email: user.email,
        type: JwtType.NormalToken, // 👈 REQUIRED
      },
      {
        secret: process.env.JWT_SECRET,
      }
    );
  }


  // async loginWithGoogle(googleUser: any) {
  //   // Find user by Google ID
  //   let user = await this.userService.findOneByGoogleId(googleUser.googleId);

  //   if (!user) {
  //     // Create user if not exists
  //     user = await this.userService.create({
  //       googleId: googleUser.googleId,
  //       email: googleUser.email,
  //       firstName: googleUser.firstName,
  //       lastName: googleUser.lastName,
  //     });
  //   }

  //   // Return backend JWT as object
  //   const accessToken = this.jwtService.sign({
  //     id: user.id,
  //     email: user.email,
  //     role: user.role,
  //     googleLogin: true, // flag for frontend if needed
  //   });

  //   return { accessToken };
  // }
}
