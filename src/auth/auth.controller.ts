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
  GetUserByTokenDtoResponse,
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

    // Get user role from response (user object is always returned from service)
    const userRole = response.user?.role || 'NONE';
    
    // Determine redirect path based on role
    let redirectTo = '/';
    if (userRole === 'PROVIDER') {
      redirectTo = '/provider/home';
    } else if (userRole === 'PENDING_PROVIDER') {
      redirectTo = '/onboarding/thank-you';
    } else if (userRole === 'CLIENT') {
      redirectTo = '/client/home';
    }

    // Return complete response with user, role, and redirect information
    return {
      message: response.message,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user ? {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      } : null,
      needsOnboarding: userRole === 'NONE',
      redirectTo, // Include redirect path in response
      role: userRole, // Include role for frontend
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
