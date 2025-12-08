import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ScanOrderDto } from './dto/scan-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
    try {
      const userId = request.user.id;
      
      // Validate input
      if (!createOrderDto.offerId || !createOrderDto.quantity) {
        throw new BadRequestException('offerId and quantity are required');
      }

      if (createOrderDto.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      const data = {
        userId: userId,
        offerId: createOrderDto.offerId,
        quantity: createOrderDto.quantity,
      };
      
      return await this.orderService.placeOrder(data);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create order');
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAll(@Req() request) {
    // Only return orders for the authenticated user
    const userId = request.user.id;
    return this.orderService.findOrderByUser(userId);
  }

  /**
   * Scan QR code and automatically confirm order (for providers)
   * Route: GET /orders/qr/:token
   * When provider scans QR code, this endpoint confirms the order automatically
   * Returns HTML for browser requests, JSON for API requests
   * Must be before /orders/:id to avoid route conflicts
   */
  @Get('qr/:token')
  @UseGuards(AuthGuard)
  async getOrderByQrToken(
    @Param('token') token: string,
    @Req() request: any,
    @Res() res: Response,
  ) {
    const providerId = request.user?.id;
    if (!providerId) {
      throw new ForbiddenException('Authentication required.');
    }

    // Automatically confirm the order when QR code is scanned
    // This prevents redirect to error page and ensures order is confirmed
    const result = await this.orderService.scanAndConfirmOrder(token, providerId);

    // Check if request is from a browser (Accept header contains text/html)
    const acceptHeader = request.headers?.accept || '';
    const isBrowserRequest = acceptHeader.includes('text/html');

    if (isBrowserRequest) {
      // Return HTML page that redirects back to the app
      const order = result.order;
      const orderId = order?.id || 'N/A';
      const message = result.message || 'Order confirmed successfully';
      const alreadyConfirmed = result.alreadyConfirmed || false;

      // Get frontend URL from environment or construct from request
      // Priority: FRONT_URL env var > Referer > Origin > FRONTEND_URL
      let frontendUrl = process.env.FRONT_URL || '';
      
      if (!frontendUrl && request.headers?.referer) {
        try {
          const refererUrl = new URL(request.headers.referer);
          frontendUrl = refererUrl.origin;
        } catch (e) {
          // Invalid referer URL
        }
      }
      if (!frontendUrl && request.headers?.origin) {
        frontendUrl = request.headers.origin;
      }
      if (!frontendUrl) {
        frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || '';
      }
      
      // Redirect to provider orders page with success message
      // Always use absolute URL for better mobile browser compatibility
      const redirectUrl = frontendUrl 
        ? `${frontendUrl}/provider/orders?confirmed=true&orderId=${orderId}&alreadyConfirmed=${alreadyConfirmed}`
        : `https://leftover.ccdev.space/provider/orders?confirmed=true&orderId=${orderId}&alreadyConfirmed=${alreadyConfirmed}`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed - Leftover</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #e8f4ee 0%, #d4e8e0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .message {
      color: #1f2937;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .submessage {
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p class="message">${message}</p>
    <p class="submessage">Redirecting back to app...</p>
  </div>
  <script>
    // Multiple redirect strategies for maximum compatibility
    (function() {
      var redirectUrl = '${redirectUrl}';
      
      // Strategy 1: Immediate redirect (works in most cases)
      try {
        if (window.top !== window.self) {
          // In iframe - redirect parent
          window.top.location.href = redirectUrl;
        } else {
          // Same window - direct redirect
          window.location.replace(redirectUrl);
        }
      } catch (e) {
        // Cross-origin error - try alternative
        try {
          window.location.href = redirectUrl;
        } catch (e2) {
          // If all else fails, meta refresh will handle it
        }
      }
      
      // Strategy 2: Fallback after short delay (for stubborn browsers)
      setTimeout(function() {
        try {
          window.location.replace(redirectUrl);
        } catch (e) {
          window.location.href = redirectUrl;
        }
      }, 100);
      
      // Strategy 3: If opened as popup, redirect opener
      if (window.opener) {
        setTimeout(function() {
          try {
            window.opener.location.href = redirectUrl;
            window.close();
          } catch (e) {
            window.close();
          }
        }, 500);
      }
    })();
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } else {
      // Return JSON for API requests
      return res.json(result);
    }
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getOrderByUser(@Param('userId') userId: string, @Req() request) {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      throw new BadRequestException('Invalid user id');
    }

    // Users can only view their own orders
    if (request.user.id !== userIdNum) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.orderService.findOrderByUser(userIdNum);
  }

  @Get('offer/:offerId')
  @UseGuards(AuthGuard)
  async getOrderByOffer(@Param('offerId') offerId: string, @Req() request) {
    const offerIdNum = parseInt(offerId, 10);
    if (isNaN(offerIdNum)) {
      throw new BadRequestException('Invalid offer id');
    }

    return this.orderService.findOrderByOffer(offerIdNum);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrderById(@Param('id') id: string, @Req() request) {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderService.findOrderById(orderId);
    
    // Users can only view their own orders or providers can view orders for their offers
    const isOwner = order.userId === request.user.id;
    const isProvider = order.offer?.ownerId === request.user.id;
    
    if (!isOwner && !isProvider) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelOrder(@Param('id') id: string, @Req() request) {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const userId = request.user.id;
    return this.orderService.cancelOrder(orderId, userId);
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
    return this.orderService.scanAndConfirmOrder(
      scanOrderDto.qrCodeToken,
      providerId,
    );
  }
}
