import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { OfferService } from '../offer/offer.service';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class OrderService {
  constructor (private prisma: PrismaService, private offerService: OfferService) {}

  async create(data: any) {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        offerId: data.offerId,
        quantity: data.quantity,
      },
    });
  }

  async findAll() {
    return await this.prisma.order.findMany();
  }

  async findOrderById(id: number) {
    return this.prisma.order.findUnique({
      where: {
        id: id,
      },
    });
  }

  async findOrderByUser(id: number) {
    return this.prisma.order.findMany({
      where: {
        userId: id
      },
    });
  }

  async findOrderByOffer(offerId: number) {
    return this.prisma.order.findMany({
      where: {
        offerId: offerId, 
      },
    });
  }

  async updateOrderStatus(id: number, status: Status) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async placeOrder(data: any) {
    const offer = await this.offerService.findOfferById(data.offerId);

    if (offer.quantity < data.quantity) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    const updatedOffer = await this.offerService.updateOfferQuantity(
      data.offerId,
      offer.quantity - data.quantity,
    );
    
    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        offerId: data.offerId,
        quantity: data.quantity,
      },
    });

    return { updatedOffer, order };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cancelOrdersAfter2Hours() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const ordersToCancel = await this.prisma.order.findMany({
      where: {
        status: Status.confirmed,
        createdAt: { lte: twoHoursAgo },
      },
    });

    for (const order of ordersToCancel) {
      await this.updateOrderStatus(order.id, Status.cancelled);
      console.log(`Order ${order.id} was automatically cancelled.`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredOrders() {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
  
    const deleted = await this.prisma.order.deleteMany({
      where: {
        createdAt: { lt: todayMidnight },
      },
    });
  
    console.log(`${deleted.count} orders were deleted.`);
  }

  async cancelOrder(orderId: number) {
    const order = await this.findOrderById(orderId);

    if (!order) {
      throw new BadRequestException(`Order with ID ${orderId} not found`);
    }

    await this.offerService.updateOfferQuantity(
      order.offerId,
      (await this.offerService.findOfferById(order.offerId)).quantity + order.quantity,
    );
  
    return this.updateOrderStatus(orderId, Status.cancelled);
  }
  

}
