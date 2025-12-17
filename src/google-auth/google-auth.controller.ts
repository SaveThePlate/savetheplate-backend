  import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { GoogleAuthService } from './google-auth.service';


  @Controller('google-auth')
  export class GoogleAuthController {
    constructor(private readonly authService: GoogleAuthService) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
      // Handled by Passport Google strategy
    }

    @Get('callback/google')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res) {
      const accessToken = await this.authService.loginWithGoogle(req.user);
    
      // ✅ SAME AS FACEBOOK FLOW
      res.redirect(
        `${process.env.FRONT_URL}/auth/success?accessToken=${accessToken}`
      );
    }

  }
