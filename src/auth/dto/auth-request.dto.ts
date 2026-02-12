import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
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
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token: string;
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

// Signup DTOs

export class SignupDtoRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'username123' })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class SignupDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user: {
    id: number;
    email: string;
    username: string;
    location: string;
    phoneNumber: string;
    profileImage: string;
    role: UserRole;
    emailVerified: boolean;
  };
  @ApiProperty() needsOnboarding: boolean;
}

// Send Verification Email DTOs

export class SendVerificationEmailDtoRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;
}

export class SendVerificationEmailDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() sent: boolean;
}

// Verify Email Code DTOs

export class VerifyEmailCodeDtoRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Verification code is required' })
  @IsString()
  @MinLength(6, { message: 'Verification code must be 6 digits' })
  code: string;
}

export class VerifyEmailCodeDtoResponse {
  @ApiProperty() verified: boolean;
  @ApiProperty() message: string;
}

// Signin DTOs

export class SigninDtoRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}

export class SigninDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user: {
    id: number;
    email: string;
    username: string;
    location: string;
    phoneNumber: string;
    profileImage: string;
    role: UserRole;
    emailVerified: boolean;
  };
  @ApiProperty() role: UserRole;
}

// Facebook Access Token DTO (for JavaScript SDK flow)
export class FacebookAccessTokenDtoRequest {
  @ApiProperty({ example: 'EAACEdEose0cBA...' })
  @IsNotEmpty({ message: 'Access token is required' })
  @IsString()
  accessToken: string;
}

export class FacebookAccessTokenDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user: {
    id: number;
    email: string;
    username: string;
    location: string;
    phoneNumber: string;
    profileImage: string;
    role: UserRole;
    emailVerified: boolean;
  };
  @ApiProperty() needsOnboarding: boolean;
}

// Facebook OAuth Callback DTOs
export class FacebookCallbackDtoRequest {
  @ApiProperty({ example: 'AQD1VtZPcu7k0kqXZFLWCX...' })
  @IsNotEmpty({ message: 'Code is required' })
  @IsString()
  code: string;

  @ApiProperty({ example: '1769903890173', required: false })
  @IsString()
  state?: string;
}

export class FacebookCallbackDtoResponse {
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty() user: {
    id: number;
    email: string;
    username: string;
    location: string;
    phoneNumber: string;
    profileImage: string;
    role: UserRole;
    emailVerified: boolean;
  };
  @ApiProperty() needsOnboarding: boolean;
}

// Google OAuth DTOs
export class GoogleAuthDtoRequest {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExIn0...',
    description: 'Google ID Token from frontend',
  })
  @IsNotEmpty({ message: 'Google ID Token is required' })
  @IsString()
  token: string;
}

export class GoogleAuthDtoResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authenticated requests',
  })
  message: string;

  @ApiProperty() accessToken: string;

  @ApiProperty() refreshToken: string;

  @ApiProperty() user: {
    id: number;
    email: string;
    username: string;
    location: string;
    phoneNumber: string;
    profileImage: string;
    role: UserRole;
    emailVerified: boolean;
  };

  @ApiProperty({
    example: true,
    description: 'Whether this is a new user (just created)',
  })
  isNewUser: boolean;

  @ApiProperty() needsOnboarding: boolean;
}
