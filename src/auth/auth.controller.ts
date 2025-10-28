import {
  Body,
  Request,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
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
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    const response = await this.authService.AuthMagicMailVerifier(AuthUserDto);
    
    // Check if user role is NONE
    if (response.user.role === 'NONE') { 
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        needsOnboarding: true, // Indicate onboarding is needed
      };
    }

    // If user exists and role is not NONE, return tokens
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      needsOnboarding: false, // User does not need onboarding
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