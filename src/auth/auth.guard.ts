import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { DecodeToken, JwtPayload, JwtType } from 'src/utils/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();
      
      // Safely extract token from cookies or authorization header
      let token: string = '';
      if (request?.cookies?.accessToken) {
        token = request.cookies.accessToken;
      } else if (request?.headers?.authorization) {
        const authHeader = request.headers.authorization;
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        throw new UnauthorizedException('Not Logged in');
      }

      const payload: JwtPayload = await DecodeToken(token);

      if (payload.type !== JwtType.NormalToken) {
        throw new UnauthorizedException('Invalid Token');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          email: payload.email,
        },
      });
      
      if (!user) {
        this.logger.warn(`User not found for email: ${payload.email}`);
        throw new NotFoundException('User not found');
      }
      
      // Set user on request object - use both methods for compatibility
      request['user'] = user;
      (request as any).user = user;
      
      // Verify user was set correctly
      if (!request['user'] || !(request as any).user) {
        this.logger.error('Failed to set user on request object');
        throw new UnauthorizedException('Failed to authenticate user');
      }
      
      this.logger.debug(`User authenticated: ${user.email} (ID: ${user.id})`);
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof NotFoundException) {
        this.logger.warn(e.message);
        throw e;
      }
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.logger.warn(`Auth guard error: ${errorMessage}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
