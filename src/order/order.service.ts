import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    /**
     * Find all orders for offers published by the given provider (ownerId)
     */
    async findOrdersForProvider(providerId: number) {
      // Find all offers by this provider
      const offers = await this.prisma.offer.findMany({
        where: { ownerId: providerId },
        select: { id: true },
      });
      const offerIds = offers.map(o => o.id);
      if (offerIds.length === 0) return [];
      // Find all orders for these offers
      return this.prisma.order.findMany({
        where: { offerId: { in: offerIds } },
        include: {
          user: true,
          offer: true,
        },
      });
    }

    /**
     * Confirm an order (set status to confirmed)
     */
async confirmOrder(orderId: number, requesterId: number) {
  const order = await this.findOrderById(orderId); // your existing finder
  if (!order) {
    throw new NotFoundException(`Order with ID ${orderId} not found`);
  }

  // Only the user who placed the order may confirm pickup
  if (order.userId !== requesterId) {
    throw new ForbiddenException('You are not allowed to confirm this order');
  }

  if (order.status === Status.cancelled) {
    throw new BadRequestException('Cannot confirm a cancelled order');
  }

  if (order.status === Status.confirmed) {
    // idempotent: already confirmed, return it
    return order;
  }

  const updated = await this.prisma.order.update({
    where: { id: orderId },
    data: { status: Status.confirmed, collectedAt: new Date() },
  });

  return updated;
}
  

}
