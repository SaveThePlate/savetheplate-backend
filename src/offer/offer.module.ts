import { Module, forwardRef } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'nestjs-prisma';
import { UsersModule } from '../users/users.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, UsersModule, forwardRef(() => WebSocketModule), CacheModule],
  providers: [OfferService, PrismaService],
  controllers: [OfferController],
  exports: [OfferService],
})
export class OfferModule {}
