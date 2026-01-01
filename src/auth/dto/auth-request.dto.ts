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
  };
  @ApiProperty() role: UserRole;
}
