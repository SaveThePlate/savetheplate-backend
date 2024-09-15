import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { User } from '@prisma/client';
import { ResendService } from 'src/utils/mailing/resend.service';
import MagicLinkEmailTemplate from 'emails/MagicLink';
import { AuthMagicMailSenderDtoRequest, AuthMagicMailVerifierDtoRequest, AuthMagicMailVerifierDtoResponse } from './dto/auth-request.dto';
import { generateToken, JwtType, DecodeToken } from 'src/utils/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly resend: ResendService,
    private readonly prisma: PrismaService,
  ) {
    
  }

  async AuthMagicMailSender(
    AuthUserDto: AuthMagicMailSenderDtoRequest,
  ): Promise<any> {
    try {
      // CHECK IF USER EXISTS
      let user = await this.prisma.user.findFirst({
        where: {
          email: AuthUserDto.email,
        },
      });

      if (!user) {
        //CREATE USER BY EMAIL
        const username = AuthUserDto.email.split('@')[0];
        user = await this.prisma.user.create({
          data: {
            email: AuthUserDto.email,
            username: username
          },
        });
      }

      // GENERATE TOKEN FROM MAIL AND ID
      const emailToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.EmailToken,
      );

      const link = `${process.env.FRONT_URL}/callback/${emailToken}`;

      //SEND EMAIL
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
        message: 'Email sent to : ' + user.email,
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

  async AuthMagicMailVerifier(
    AuthUserDto: AuthMagicMailVerifierDtoRequest,
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    try {
      //DECODE TOKEN
      const datafromtoken = await DecodeToken(AuthUserDto.token);

      const user = await this.prisma.user.findFirst({
        where: {
          id: Number(datafromtoken.id),
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // GENERATE TOKEN FROM MAIL AND ID
      const accessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      //GENERATE REFRESH TOKEN
      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      return {
        message: 'User Verified',
        accessToken,
        refreshToken,
        user,
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