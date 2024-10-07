import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'nestjs-prisma';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  imports: [PrismaModule]
})
export class OrderModule {}
