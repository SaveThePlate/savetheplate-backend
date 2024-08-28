import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { DecodeToken, JwtPayload, JwtType } from 'src/utils/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();
      const token: string =
        request?.cookies?.accessToken ||
        request?.headers?.authorization?.split(' ')[1] ||
        '';

      if (!token) throw new UnauthorizedException('Not Logged in');

      const payload: JwtPayload = await DecodeToken(token);

      if (payload.type !== JwtType.NormalToken)
        throw new UnauthorizedException('Invalid Token');

      const user = await this.prisma.user.findFirst({
        where: {
          email: payload.email,
        },
      });
      if (!user) {
        this.logger.warn(`User not found for email: ${payload.email}`);
        throw new NotFoundException('User not found');
    }
      request['user'] = user;
      return true;
    } catch (e) {
      this.logger.warn(e.message);
      throw new UnauthorizedException();
    }
  }
}