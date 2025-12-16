import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthService } from './google-auth.service';


@Controller('google-auth')
export class GoogleAuthController {
    constructor(private readonly authService: GoogleAuthService) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {}

    @Get('callback/google')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res) {
      const token = await this.authService.loginWithGoogle(req.user);
    
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONT_URL}/auth/success?token=${token}`);
    }


}