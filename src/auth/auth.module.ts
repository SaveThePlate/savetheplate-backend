import { Module } from '@nestjs/common';
import { ResendModule } from 'src/utils/mailing/resend.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [ResendModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
