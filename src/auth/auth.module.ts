import { Module } from '@nestjs/common';
import { ResendModule } from 'src/utils/mailing/resend.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/cache/cache.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [ResendModule, PrismaModule, CacheModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, AdminGuard],
  exports: [AuthGuard, RolesGuard, AdminGuard],
})
export class AuthModule {}
