import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { OfferService } from '../offer/offer.service';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { randomBytes } from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private offerService: OfferService,
    @Inject(forwardRef(() => AppWebSocketGateway))
    private wsGateway: AppWebSocketGateway,
  ) {}

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
    return await this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrderById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findOrderByUser(id: number) {
    return this.prisma.order.findMany({
      where: {
        userId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            // Include owner (provider) information to always get fresh data
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  async findOrderByOffer(offerId: number) {
    return this.prisma.order.findMany({
      where: {
        offerId: offerId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOrderStatus(id: number, status: Status) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Generate a unique QR code token for an order
   */
  private generateQrCodeToken(): string {
    // Generate a secure random token: order-{timestamp}-{randomBytes}
    const timestamp = Date.now();
    const randomPart = randomBytes(16).toString('hex');
    return `order-${timestamp}-${randomPart}`;
  }

  async placeOrder(data: any) {
    // Validate input
    if (!data.offerId || !data.quantity || data.quantity <= 0) {
      throw new BadRequestException(
        'Invalid order data: offerId and quantity are required',
      );
    }

    // Check if offer exists
    const offer = await this.offerService.findOfferById(data.offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check if offer has enough quantity
    if (offer.quantity < data.quantity) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    // Check if offer is expired
    if (new Date(offer.expirationDate) < new Date()) {
      throw new BadRequestException('Cannot place order for expired offer');
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Update offer quantity
      const updatedOffer = await tx.offer.update({
        where: { id: data.offerId },
        data: { quantity: offer.quantity - data.quantity },
      });

      // Generate unique QR code token for this order
      const qrCodeToken = this.generateQrCodeToken();

      // Create order
      const order = await tx.order.create({
        data: {
          userId: data.userId,
          offerId: data.offerId,
          quantity: data.quantity,
          qrCodeToken: qrCodeToken,
          status: Status.pending,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              phoneNumber: true,
              location: true,
              profileImage: true,
            },
          },
          offer: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  location: true,
                  phoneNumber: true,
                  mapsLink: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      });

      return { updatedOffer, order };
    });

    // Emit real-time update
    try {
      this.wsGateway.emitOrderUpdate(result.order, 'created');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    return result;
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async cancelOrdersAfter2Hours() {
  //   const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  //   const ordersToCancel = await this.prisma.order.findMany({
  //     where: {
  //       status: Status.confirmed,
  //       createdAt: { lte: twoHoursAgo },
  //     },
  //   });

  //   for (const order of ordersToCancel) {
  //     await this.updateOrderStatus(order.id, Status.cancelled);
  //     console.log(`Order ${order.id} was automatically cancelled.`);
  //   }
  // }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async deleteExpiredOrders() {
  //   const todayMidnight = new Date();
  //   todayMidnight.setHours(0, 0, 0, 0);

  //   const deleted = await this.prisma.order.deleteMany({
  //     where: {
  //       createdAt: { lt: todayMidnight },
  //     },
  //   });

  //   console.log(`${deleted.count} orders were deleted.`);
  // }

  async cancelOrder(orderId: number, userId?: number) {
    const order = await this.findOrderById(orderId);

    // Check if order can be cancelled
    if (order.status === Status.cancelled) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === Status.confirmed) {
      throw new BadRequestException('Cannot cancel a confirmed order');
    }

    // If userId is provided, verify ownership
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Get offer to restore quantity
    const offer = await this.offerService.findOfferById(order.offerId);

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Restore quantity to offer
      await tx.offer.update({
        where: { id: order.offerId },
        data: { quantity: offer.quantity + order.quantity },
      });

      // Update order status
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: { status: Status.cancelled },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              phoneNumber: true,
              location: true,
              profileImage: true,
            },
          },
          offer: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  location: true,
                  phoneNumber: true,
                  mapsLink: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      });

      return cancelled;
    });

    // Emit real-time update
    try {
      this.wsGateway.emitOrderUpdate(result, 'updated');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    return result;
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
    const offerIds = offers.map((o) => o.id);
    if (offerIds.length === 0) return [];
    // Find all orders for these offers
    // Explicitly include user fields to ensure fresh data (no caching)
    return this.prisma.order.findMany({
      where: { offerId: { in: offerIds } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            // Include owner (provider) information to always get fresh data
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find order by QR code token
   */
  async findOrderByQrToken(qrCodeToken: string) {
    return this.prisma.order.findUnique({
      where: { qrCodeToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            // Include owner (provider) information to always get fresh data
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get offer for an order (helper method)
   */
  async getOfferForOrder(offerId: number) {
    return this.offerService.findOfferById(offerId);
  }

  /**
   * Scan and confirm an order using QR code token (for providers)
   * Provider confirms the order when customer shows QR code
   */
  async scanAndConfirmOrder(qrCodeToken: string, providerId: number) {
    const order = await this.findOrderByQrToken(qrCodeToken);

    if (!order) {
      throw new NotFoundException('Invalid QR code. Order not found.');
    }

    // Verify that the provider owns the offer
    const offer = await this.offerService.findOfferById(order.offerId);
    if (offer.ownerId !== providerId) {
      throw new ForbiddenException(
        'You are not authorized to confirm this order. This order belongs to a different provider.',
      );
    }

    if (order.status === Status.cancelled) {
      throw new BadRequestException('Cannot confirm a cancelled order');
    }

    if (order.status === Status.confirmed) {
      // Already confirmed - return order info
      return {
        order,
        message: 'Order was already confirmed',
        alreadyConfirmed: true,
      };
    }

    // Update order status to confirmed
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: Status.confirmed,
        collectedAt: new Date(),
        // Invalidate QR token after use (optional - for extra security)
        // qrCodeToken: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            // Include owner (provider) information to always get fresh data
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    // Emit real-time update
    try {
      this.wsGateway.emitOrderUpdate(updated, 'updated');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    return {
      order: updated,
      message: 'Order confirmed successfully',
      alreadyConfirmed: false,
    };
  }

  /**
   * Confirm an order (legacy method - kept for backward compatibility)
   * Now customers can still manually confirm, but QR scanning is preferred
   */
  async confirmOrder(orderId: number, requesterId: number) {
    const order = await this.findOrderById(orderId);
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
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
          },
        },
        offer: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                location: true,
                phoneNumber: true,
                mapsLink: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    // Emit real-time update
    try {
      this.wsGateway.emitOrderUpdate(updated, 'updated');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    return updated;
  }
}
