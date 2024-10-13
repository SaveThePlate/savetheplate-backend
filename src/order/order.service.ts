import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';


@Injectable()
export class OrderService {
  constructor (private prisma: PrismaService) {}

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

}
