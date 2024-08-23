import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OfferModule } from './offer/offer.module';
import { StorageModule } from './storage/storage.module';import { ProductsModule } from './products/products.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [ ProductsModule,AuthModule, OfferModule, StorageModule],
  controllers: [AppController],
  providers: [AppService,PrismaService],
  exports: [PrismaService],
})
export class AppModule {}



