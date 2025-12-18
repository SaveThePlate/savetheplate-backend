import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User, UserRole } from '@prisma/client';

// AuthMagicMailSender

export class AuthMagicMailSenderDtoRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;
}

export class AuthMagicMailSenderDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() sended: boolean;
}

// AuthMagicMailVerifier

export class AuthMagicMailVerifierDtoRequest {
  @ApiProperty() token: string;
}

export class AuthMagicMailVerifierDtoResponse {
  @ApiProperty() message?: string;
  @ApiProperty() accessToken: string | null;
  @ApiProperty() refreshToken: string | null;
  @ApiProperty() user?: {
    id: number;
    email: string;
    role: UserRole;
  } | null;
  @ApiProperty() needsOnboarding?: boolean;
  @ApiProperty() redirectToOnboarding?: boolean;
  @ApiProperty() redirectTo?: string; // Redirect path based on user role
  @ApiProperty() role?: UserRole; // User role for frontend
}

export class GetUserByTokenDtoResponse {
  @ApiProperty() user: User;
  @ApiProperty() redirectToOnboarding: boolean;
}

// Google OAuth

export class GoogleAuthDtoRequest {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...' })
  @IsNotEmpty({ message: 'Google credential is required' })
  @IsString()
  credential: string;
}

export class GoogleAuthDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user?: {
    id: number;
    email: string;
    role: UserRole;
  } | null;
  @ApiProperty() role?: UserRole;
  @ApiProperty() needsOnboarding?: boolean;
  @ApiProperty() redirectTo?: string;
}

// Facebook OAuth

export class FacebookAuthDtoRequest {
  @ApiProperty({ example: 'EAABsbCS1iHgBO...' })
  @IsNotEmpty({ message: 'Facebook access token is required' })
  @IsString()
  accessToken: string;
}

export class FacebookAuthDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user?: {
    id: number;
    email: string;
    role: UserRole;
  } | null;
  @ApiProperty() role?: UserRole;
  @ApiProperty() needsOnboarding?: boolean;
  @ApiProperty() redirectTo?: string;
}

// Facebook OAuth Callback (Server-side OAuth flow)

export class FacebookCallbackDtoRequest {
  @ApiProperty({ example: 'AQB...' })
  @IsNotEmpty({ message: 'OAuth code is required' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'state-token', required: false })
  @IsString()
  state?: string;
}

export class FacebookCallbackDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user?: {
    id: number;
    email: string;
    role: UserRole;
  } | null;
  @ApiProperty() role?: UserRole;
  @ApiProperty() needsOnboarding?: boolean;
  @ApiProperty() redirectTo?: string;
}
