import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'nestjs-prisma';

@Module({
  controllers: [RatingController],
  providers: [RatingService, PrismaService],
  imports: [PrismaModule],
  exports: [RatingService],
})
export class RatingModule {}

