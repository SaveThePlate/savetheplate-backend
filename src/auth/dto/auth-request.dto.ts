import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

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
  @ApiProperty() message: string;
  @ApiProperty() accessToken: string | null;
  @ApiProperty() refreshToken: string | null;
  @ApiProperty() user: {
    id: any;
    email: string;
  } | null;
}

export class GetUserByTokenDtoResponse {
  @ApiProperty() user: User;
}