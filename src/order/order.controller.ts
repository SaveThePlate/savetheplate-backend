import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Status } from '@prisma/client';


@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createOrderDto: CreateOrderDto, @Req() request) {
    const userId = request.user.id;
    const data = {
      userId: userId,
      offerId: createOrderDto.offerId,
      quantity: createOrderDto.quantity,
    };
    return this.orderService.placeOrder(data);
  }

  @Get()
  async getAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrderById(@Param('id') id: number) {
    return this.orderService.findOrderById(Number(id));
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getOrderByUser(@Param('userId') userId: number) {
    return this.orderService.findOrderByUser(Number(userId));
  }

  @Get('offer/:offerId')
  @UseGuards(AuthGuard)
  async getOrderByOffer(@Param('offerId') offerId: number) {
    return this.orderService.findOrderByOffer(Number(offerId));
  }

  @Patch(':id/cancel')
  async cancelOrder(@Param('id') id: number) {
    return this.orderService.updateOrderStatus(Number(id), Status.cancelled);
  }
}
