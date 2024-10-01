import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':offerId')
  @UseGuards(AuthGuard)
  async create(@Param('offerId') offerId: number, @Body() createOrderDto: CreateOrderDto, @Req() request: Request) {
    const user: User = request['user'];
    const data = {
      userId: user.id,
      offerId: offerId,
      quantity: createOrderDto.quantity,
    };
    return this.orderService.create(data);
  }

  @Get()
  async getAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOrderById(@Param('id') id: number) {
    return this.orderService.findOrderById(Number(id));
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async getOrderByUser(@Req() request: Request) {
    const user: User = request['user'];
    return this.orderService.findOrderByUser(user.id);
  }

  @Get('offer/:offerId')
  @UseGuards(AuthGuard)
  async getOrderByOffer(@Param('offerId') offerId: number) {
    return this.orderService.findOrderByOffer(Number(offerId));
  }
}
