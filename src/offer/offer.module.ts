import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'nestjs-prisma';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [OfferService, PrismaService],
  controllers: [OfferController],
  exports: [OfferService],
})
export class OfferModule {}
