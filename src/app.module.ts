import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OfferModule } from './offer/offer.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { OrderModule } from './order/order.module';
import { ContactModule } from './contact/contact.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    AuthModule,
    OfferModule,
    StorageModule,
    UsersModule,
    OrderModule,
    ContactModule,
    ScheduleModule.forRoot(),
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
