import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRatingDto, userId: number) {
    // Validate rating value (1-5)
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Verify order exists and belongs to the user
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        offer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify the order belongs to the user making the rating
    if (order.userId !== userId) {
      throw new ForbiddenException('You can only rate your own orders');
    }

    // Verify order is confirmed and collected
    if (order.status !== 'confirmed' || !order.collectedAt) {
      throw new BadRequestException(
        'You can only rate orders that have been confirmed and collected',
      );
    }

    // Verify providerId matches the offer's owner
    if (order.offer.ownerId !== data.providerId) {
      throw new BadRequestException(
        'Provider ID does not match the order provider',
      );
    }

    // Check if rating already exists for this order
    const existingRating = await this.prisma.rating.findUnique({
      where: { orderId: data.orderId },
    });

    if (existingRating) {
      throw new BadRequestException('This order has already been rated');
    }

    // Create the rating
    const rating = await this.prisma.rating.create({
      data: {
        orderId: data.orderId,
        providerId: data.providerId,
        userId: userId,
        rating: data.rating,
        tags: data.tags || [],
        comment: data.comment || null,
      },
    });

    return rating;
  }

  async findByOrderId(orderId: number, userId: number) {
    // First verify the order exists and user has access
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        offer: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify the user has access to this order (either the customer or the provider)
    if (order.userId !== userId && order.offer.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Now check if rating exists
    const rating = await this.prisma.rating.findUnique({
      where: { orderId },
    });

    // Return null if rating doesn't exist (frontend handles this gracefully)
    return rating;
  }

  async getProviderAverage(providerId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { providerId },
      select: {
        rating: true,
      },
    });

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    return {
      averageRating: Math.round(average * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length,
    };
  }
}

