import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendModule } from 'src/utils/mailing/resend.module';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [ResendModule, PrismaModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, PrismaService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
