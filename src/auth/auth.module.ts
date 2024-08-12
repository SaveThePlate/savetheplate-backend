import { Module } from '@nestjs/common';
import { ResendModule } from 'src/utils/mailing/resend.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'nestjs-prisma';

@Module({
  imports: [ResendModule, ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}