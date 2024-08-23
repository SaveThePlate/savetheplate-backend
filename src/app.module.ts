import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OfferModule } from './offer/offer.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [AuthModule, OfferModule, StorageModule],

  controllers: [AppController],
  providers: [AppService,
                ],
})
export class AppModule {};