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
  SignupDtoRequest,
  SignupDtoResponse,
  SigninDtoRequest,
  SigninDtoResponse,
  SendVerificationEmailDtoRequest,
  SendVerificationEmailDtoResponse,
  VerifyEmailCodeDtoRequest,
  VerifyEmailCodeDtoResponse,
} from './dto/auth-request.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ENDPOINT TO SIGN IN WITH PASSWORD
  @Post('/signin')
  @ApiOkResponse({ type: SigninDtoResponse })
  async signin(@Body() signinDto: SigninDtoRequest) {
    try {
      return await this.authService.signin(signinDto);
    } catch (error) {
      // Log the error for debugging
      const errorObj = error as any;
      console.error('Signin controller error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        status: errorObj?.status,
        response: errorObj?.response,
      });
      throw error;
    }
  }

  // ENDPOINT TO REGISTER USER WITH PASSWORD
  @Post('/signup')
  @ApiOkResponse({ type: SignupDtoResponse })
  async signup(@Body() signupDto: SignupDtoRequest) {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      // Log the error for debugging
      const errorObj = error as any;
      console.error('Signup controller error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        status: errorObj?.status,
        response: errorObj?.response,
      });
      throw error;
    }
  }

  // ENDPOINT TO REGISTER USER
  @Post('/send-magic-mail')
  @ApiOkResponse({ type: AuthMagicMailSenderDtoResponse })
  async Auth(@Body() AuthUserDto: AuthMagicMailSenderDtoRequest) {
    return await this.authService.AuthMagicMailSender(AuthUserDto);
  }

  @Post('/verify-magic-mail') // Added the method type
  @ApiOkResponse({ type: AuthMagicMailVerifierDtoResponse })
  async AuthMagicMailVerifier(
    @Body() AuthUserDto: AuthMagicMailVerifierDtoRequest,
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    try {
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
        user: response.user
          ? {
              id: response.user.id,
              email: response.user.email,
              role: response.user.role,
            }
          : null,
        needsOnboarding: userRole === 'NONE',
        redirectTo, // Include redirect path in response
        role: userRole, // Include role for frontend
      };
    } catch (error) {
      // Log the error for debugging
      const errorObj = error as any;
      console.error('Verify magic mail controller error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        status: errorObj?.status,
        response: errorObj?.response,
        token: AuthUserDto?.token ? 'present' : 'missing',
      });
      throw error;
    }
  }

  // ENDPOINT TO SEND VERIFICATION EMAIL
  @Post('/send-verification-email')
  @ApiOkResponse({ type: SendVerificationEmailDtoResponse })
  async sendVerificationEmail(
    @Body() sendVerificationDto: SendVerificationEmailDtoRequest,
  ) {
    try {
      return await this.authService.sendVerificationEmail(sendVerificationDto);
    } catch (error) {
      const errorObj = error as any;
      console.error('Send verification email controller error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        status: errorObj?.status,
        response: errorObj?.response,
      });
      throw error;
    }
  }

  // ENDPOINT TO VERIFY EMAIL CODE
  @Post('/verify-email-code')
  @ApiOkResponse({ type: VerifyEmailCodeDtoResponse })
  async verifyEmailCode(@Body() verifyCodeDto: VerifyEmailCodeDtoRequest) {
    try {
      return await this.authService.verifyEmailCode(verifyCodeDto);
    } catch (error) {
      const errorObj = error as any;
      console.error('Verify email code controller error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        status: errorObj?.status,
        response: errorObj?.response,
      });
      throw error;
    }
  }

  // ENDPOINT TO GET USER BY TOKEN
  @Get('/get-user-by-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: GetUserByTokenDtoResponse })
  GetUserByToken(@Req() request: Request) {
    return this.authService.GetUserByToken(request);
  }
}
