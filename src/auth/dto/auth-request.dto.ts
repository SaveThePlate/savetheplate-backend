import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

// AuthMagicMailSender

export class AuthMagicMailSenderDtoRequest {
  @ApiProperty() email: string;
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
