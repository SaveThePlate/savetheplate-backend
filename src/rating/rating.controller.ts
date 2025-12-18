import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  /**
   * Create a rating for an order
   * Route: POST /ratings
   * Requires authentication
   */
  @Post()
  @UseGuards(AuthGuard)
  async createRating(@Body() createRatingDto: CreateRatingDto, @Req() request) {
    const userId = request.user.id;
    return this.ratingService.createRating(createRatingDto, userId);
  }

  /**
   * Get rating by order ID
   * Route: GET /ratings/order/:orderId
   * Requires authentication
   */
  @Get('order/:orderId')
  @UseGuards(AuthGuard)
  async getRatingByOrderId(
    @Param('orderId') orderId: string,
    @Req() request,
  ) {
    const orderIdNum = parseInt(orderId, 10);
    if (isNaN(orderIdNum)) {
      throw new NotFoundException('Invalid order ID');
    }

    const userId = request.user.id;
    const rating = await this.ratingService.getRatingByOrderId(
      orderIdNum,
      userId,
    );

    if (!rating) {
      throw new NotFoundException('Rating not found for this order');
    }

    return rating;
  }

  /**
   * Get all ratings for a provider
   * Route: GET /ratings/provider/:providerId
   * Requires authentication
   */
  @Get('provider/:providerId')
  @UseGuards(AuthGuard)
  async getRatingsByProvider(@Param('providerId') providerId: string) {
    const providerIdNum = parseInt(providerId, 10);
    if (isNaN(providerIdNum)) {
      throw new NotFoundException('Invalid provider ID');
    }

    return this.ratingService.getRatingsByProvider(providerIdNum);
  }

  /**
   * Get average rating for a provider
   * Route: GET /ratings/provider/:providerId/average
   * Requires authentication
   */
  @Get('provider/:providerId/average')
  @UseGuards(AuthGuard)
  async getAverageRating(@Param('providerId') providerId: string) {
    const providerIdNum = parseInt(providerId, 10);
    if (isNaN(providerIdNum)) {
      throw new NotFoundException('Invalid provider ID');
    }

    return this.ratingService.getAverageRating(providerIdNum);
  }
}

