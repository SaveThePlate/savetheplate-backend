import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'nestjs-prisma';

@Module({
  imports: [PrismaModule],
  providers: [OfferService, PrismaService],
  controllers: [OfferController],
})
export class OfferModule {}
