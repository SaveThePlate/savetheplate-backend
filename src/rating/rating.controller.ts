import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createRatingDto: CreateRatingDto, @Req() request) {
    try {
      const userId = request.user.id;
      return await this.ratingService.create(createRatingDto, userId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to create rating';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard)
  async getByOrderId(@Param('orderId') orderId: string, @Req() request) {
    const orderIdNum = parseInt(orderId, 10);
    if (isNaN(orderIdNum)) {
      throw new BadRequestException('Invalid order id');
    }

    const userId = request.user.id;
    const rating = await this.ratingService.findByOrderId(orderIdNum, userId);
    
    // Return 404 if rating doesn't exist (frontend expects this)
    if (!rating) {
      throw new NotFoundException('Rating not found for this order');
    }
    
    return rating;
  }

  @Get('provider/:providerId/average')
  @UseGuards(AuthGuard)
  async getProviderAverage(@Param('providerId') providerId: string) {
    const providerIdNum = parseInt(providerId, 10);
    if (isNaN(providerIdNum)) {
      throw new BadRequestException('Invalid provider id');
    }

    return await this.ratingService.getProviderAverage(providerIdNum);
  }
}

