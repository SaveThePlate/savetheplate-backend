import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user'] as any;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Normalize user roles into a string array
    const userRoles: string[] = (() => {
      if (Array.isArray(user.role)) return user.role.map(String);
      if (typeof user.role === 'string') return [user.role];
      if (Array.isArray(user.roles)) return user.roles.map(String);
      if (typeof user.roles === 'string') return [user.roles];
      return [];
    })().map((r) => r.trim());

    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role as string),
    );

    if (!hasRole) {
      throw new ForbiddenException('Access denied. Insufficient role.');
    }

    return true;
  }
}
