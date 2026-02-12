import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDtoRequest {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjExIn0...',
    description: 'Google ID Token from frontend',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class GoogleAuthDtoResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authenticated requests',
  })
  accessToken: string;

  @ApiProperty({
    example: 'user',
    description: 'User role',
  })
  role: string;

  @ApiProperty({
    example: 1,
    description: 'User ID',
  })
  userId: number;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is a new user (just created)',
  })
  isNewUser: boolean;
}

export class GoogleCallbackDtoResponse {
  accessToken: string;
  role: string;
  userId: number;
  email: string;
  username: string;
  isNewUser: boolean;
}
