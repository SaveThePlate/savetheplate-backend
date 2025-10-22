import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { User, UserRole } from '@prisma/client';
import { ResendService } from 'src/utils/mailing/resend.service';
import MagicLinkEmailTemplate from 'emails/MagicLink';
import {
  AuthMagicMailSenderDtoRequest,
  AuthMagicMailVerifierDtoRequest,
  AuthMagicMailVerifierDtoResponse,
} from './dto/auth-request.dto';
import { generateToken, JwtType, DecodeToken } from 'src/utils/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly resend: ResendService,
    private readonly prisma: PrismaService,
  ) {}

  // Send a magic link email to the user
  async AuthMagicMailSender(
    AuthUserDto: AuthMagicMailSenderDtoRequest,
  ): Promise<any> {
    try {
      // Check if user exists
      let user = await this.prisma.user.findFirst({
        where: {
          email: AuthUserDto.email,
        },
      });

      if (!user) {
        // Create user by email if not found
        const username = AuthUserDto.email.split('@')[0];
        user = await this.prisma.user.create({
          data: {
            email: AuthUserDto.email,
            username: username,
            role: UserRole.NONE, // Set initial role to NONE
          },
        });
      }

      // Generate token from email and user ID
      const emailToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.EmailToken,
      );

      const link = `${process.env.FRONT_URL}/callback/${emailToken}`;

      // For local dev: Skip email and return the link directly
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔗 Magic Link (Local Dev):', link);
        return {
          message: `Magic link generated for ${user.email}`,
          sent: true,
          magicLink: link, // Return link directly in dev mode
          emailToken, // Also return the token
        };
      }

      // Production: Send actual email
      const mail_resp = await this.resend.getResendInstance().emails.send({
        from: 'no-reply@resend.ccdev.space',
        to: user.email,
        subject: 'Log in to SaveThePlate',
        react: MagicLinkEmailTemplate({ magicLink: link }),
      });

      if (mail_resp.error) {
        throw new Error(mail_resp.error.message);
      }

      return {
        message: `Email sent to: ${user.email}`,
        sent: true,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message || 'Error sending email.',
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Verify the magic mail token and return user info
  async AuthMagicMailVerifier(
    AuthUserDto: AuthMagicMailVerifierDtoRequest,
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    try {
      // Decode token to get user data
      const dataFromToken = await DecodeToken(AuthUserDto.token);

      // Find the user
      const user = await this.prisma.user.findFirst({
        where: {
          id: Number(dataFromToken.id),
        },
      });

      // Check if user exists
      if (!user) {
        return await this.createUser(dataFromToken.email);
      }

      // Generate tokens
      const accessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      // Check the user role
      if (user.role === UserRole.NONE) {
        return {
          message: 'User needs onboarding.',
          accessToken,
          refreshToken,
          user,
          redirectToOnboarding: true, // Indicate that the user should be redirected
        };
      }

      return {
        message: 'User Verified',
        accessToken,
        refreshToken,
        user,
        redirectToOnboarding: false, // Existing user does not need onboarding
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Token is not valid or expired.',
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Create a new user and generate tokens
  async createUser(email: string) {
    const username = email.split('@')[0];
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        role: UserRole.NONE, // Default role
      },
    });

    // Generate and return access and refresh tokens
    const accessToken = await generateToken(
      user.id.toString(),
      user.email,
      JwtType.NormalToken,
    );

    const refreshToken = await generateToken(
      user.id.toString(),
      user.email,
      JwtType.RefreshToken,
    );

    return {
      message: 'User Created',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        location: user.location || '',
        phoneNumber: user.phoneNumber || '',
        profileImage: user.profileImage || '',
        role: user.role,
      }, 
      needsOnboarding: true, // New user needs to complete onboarding
    };
  }

  // Get user by token (for protected routes)
  async GetUserByToken(req: Request): Promise<User> {
    try {
      return req['user'];
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Token is not valid or expired.',
        },
        HttpStatus.FORBIDDEN,
        {
          cause: e,
        },
      );
    }
  }
}
