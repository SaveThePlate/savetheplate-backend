import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'nestjs-prisma';
import { ResendModule } from 'src/utils/mailing/resend.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, PrismaModule, ResendModule, CacheModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
