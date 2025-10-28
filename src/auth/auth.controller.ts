import {
  Body,
  Request,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { 
  AuthMagicMailSenderDtoRequest, 
  AuthMagicMailSenderDtoResponse, 
  AuthMagicMailVerifierDtoRequest, 
  AuthMagicMailVerifierDtoResponse, 
  GetUserByTokenDtoResponse 
} from './dto/auth-request.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ENDPOINT TO REGISTER USER
  @Post('/send-magic-mail')
  @ApiOkResponse({ type: AuthMagicMailSenderDtoResponse })
  Auth(@Body() AuthUserDto: AuthMagicMailSenderDtoRequest) {
    return this.authService.AuthMagicMailSender(AuthUserDto);
  }

  @Post('/verify-magic-mail') // Added the method type
  @ApiOkResponse({ type: AuthMagicMailVerifierDtoResponse })
  async AuthMagicMailVerifier(
    @Body() AuthUserDto: AuthMagicMailVerifierDtoRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    const response = await this.authService.AuthMagicMailVerifier(AuthUserDto);

    // Configure cookie options
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };

    // If COOKIE_DOMAIN is set (for cross-subdomain cookies), include it
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Set HttpOnly cookies for access and refresh tokens
    if (response.accessToken) {
      res.cookie('accessToken', response.accessToken, cookieOptions);
    }
    if (response.refreshToken) {
      res.cookie('refreshToken', response.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

  // Role-based onboarding/redirect disabled in the new approach.
  // const needsOnboarding = response.user?.role === 'NONE';
  const needsOnboarding = false;

    // In production we avoid returning tokens in the response body (cookie is authoritative)
    if (process.env.NODE_ENV === 'production') {
      return {
        accessToken: null,
        refreshToken: null,
        user: response.user,
        needsOnboarding,
      };
    }

    // In development, return tokens as before for convenience
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      needsOnboarding,
    };
  }

  // ENDPOINT TO GET USER BY TOKEN
  @Get('/get-user-by-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: GetUserByTokenDtoResponse })
  GetUserByToken(@Req() request: Request) {
    return this.authService.GetUserByToken(request);
  }
}
