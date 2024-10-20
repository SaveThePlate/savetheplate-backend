import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { OfferService } from '../offer/offer.service';



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
    console.log("status from backend", status);
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

}
