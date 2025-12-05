import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ScanOrderDto } from './dto/scan-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Status } from '@prisma/client';


@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

    /**
     * Get all orders for offers published by the current provider
     * Route: GET /orders/provider
     * Requires authentication
     */
    @Get('provider')
    @UseGuards(AuthGuard)
    async getOrdersForProvider(@Req() request) {
      const providerId = request.user.id;
      return this.orderService.findOrdersForProvider(providerId);
    }

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

  /**
   * Get order details by QR code token (for preview before scanning)
   * Route: GET /orders/qr/:token
   * Must be before /orders/:id to avoid route conflicts
   */
  @Get('qr/:token')
  @UseGuards(AuthGuard)
  async getOrderByQrToken(@Param('token') token: string, @Req() request) {
    const providerId = request.user?.id;
    const order = await this.orderService.findOrderByQrToken(token);
    
    if (!order) {
      throw new NotFoundException('Invalid QR code. Order not found.');
    }

    // Verify provider owns the offer
    const offer = await this.orderService.getOfferForOrder(order.offerId);
    if (offer.ownerId !== providerId) {
      throw new ForbiddenException('You are not authorized to view this order.');
    }

    return order;
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

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrderById(@Param('id') id: number) {
    return this.orderService.findOrderById(Number(id));
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: number) {
    return this.orderService.cancelOrder(Number(id));
  }

    /**
     * Confirm an order (set status to confirmed)
     * Route: POST /orders/:id/confirm
     * Legacy endpoint - customers can still manually confirm
     */
    @Post(':id/confirm')
    @UseGuards(AuthGuard)
    async confirmOrder(@Param('id') id: number, @Req() request) {
      const requesterId = request.user?.id;
      return this.orderService.confirmOrder(Number(id), Number(requesterId));
    }

    /**
     * Scan QR code and confirm order (for providers)
     * Route: POST /orders/scan
     * Provider scans the QR code shown by customer to confirm pickup
     */
    @Post('scan')
    @UseGuards(AuthGuard)
    async scanOrder(@Body() scanOrderDto: ScanOrderDto, @Req() request) {
      const providerId = request.user?.id;
      return this.orderService.scanAndConfirmOrder(scanOrderDto.qrCodeToken, providerId);
    }

}
