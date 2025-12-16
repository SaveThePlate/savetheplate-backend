import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmails: string[];

  constructor() {
    // Get admin emails from environment variable (comma-separated)
    // Default to the admin email found in the codebase
    const adminEmailsEnv =
      process.env.ADMIN_EMAILS || 'savetheplatetunisia@gmail.com';
    this.adminEmails = adminEmailsEnv
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const user = request['user'] as any;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Support multiple possible shapes: user.email, user.emails[0], etc.
    const rawEmail =
      (typeof user.email === 'string' && user.email) ||
      (Array.isArray(user.emails) && user.emails[0]) ||
      '';

    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      throw new ForbiddenException('User email not found');
    }

    const isAdmin = this.adminEmails.includes(email);

    if (!isAdmin) {
      throw new ForbiddenException(
        'Access denied. This endpoint is restricted to administrators only.',
      );
    }

    return true;
  }
}
