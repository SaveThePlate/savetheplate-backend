import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CacheService } from '../cache/cache.service';
import { Status } from '@prisma/client';

@Injectable()
export class RatingService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Create a rating for an order
   */
  async createRating(createRatingDto: CreateRatingDto, userId: number) {
    // Validate that the order exists and belongs to the user
    const order = await this.prisma.order.findUnique({
      where: { id: createRatingDto.orderId },
      include: {
        offer: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify that the order belongs to the user making the rating
    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You can only rate orders that belong to you',
      );
    }

    // Verify that the order has an offer
    if (!order.offer) {
      throw new NotFoundException('Offer not found for this order');
    }

    // Verify that the providerId matches the offer's owner
    if (order.offer.ownerId !== createRatingDto.providerId) {
      throw new BadRequestException(
        'Provider ID does not match the order offer owner',
      );
    }

    // Check if order is confirmed and has been collected
    if (order.status !== Status.confirmed || !order.collectedAt) {
      throw new BadRequestException(
        'You can only rate orders that have been confirmed and collected',
      );
    }

    // Check if rating already exists for this order
    const existingRating = await this.prisma.rating.findUnique({
      where: { orderId: createRatingDto.orderId },
    });

    if (existingRating) {
      throw new BadRequestException('This order has already been rated');
    }

    // Create the rating
    const rating = await this.prisma.rating.create({
      data: {
        orderId: createRatingDto.orderId,
        providerId: createRatingDto.providerId,
        userId: userId,
        rating: createRatingDto.rating,
        tags: createRatingDto.tags || [],
        comment: createRatingDto.comment || null,
      },
      include: {
        order: {
          include: {
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
        },
      },
    });

    // Invalidate cache for provider ratings
    await this.cacheService.invalidateProviderRatings(
      createRatingDto.providerId,
    );

    return rating;
  }

  /**
   * Get rating by order ID
   */
  async getRatingByOrderId(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify that the order belongs to the user
    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You can only view ratings for your own orders',
      );
    }

    const rating = await this.prisma.rating.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
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
        },
      },
    });

    return rating;
  }

  /**
   * Get all ratings for a provider
   */
  async getRatingsByProvider(providerId: number) {
    const cacheKey = this.cacheService.getProviderRatingsKey(providerId);
    const cached = await this.cacheService.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const ratings = await this.prisma.rating.findMany({
      where: { providerId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
            offer: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, ratings, 300);
    return ratings;
  }

  /**
   * Get average rating for a provider
   */
  async getAverageRating(providerId: number) {
    const cacheKey = this.cacheService.getProviderAverageRatingKey(providerId);
    const cached = await this.cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.prisma.rating.aggregate({
      where: { providerId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const average = {
      averageRating: result._avg.rating || 0,
      totalRatings: result._count.rating || 0,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, average, 300);
    return average;
  }
}

