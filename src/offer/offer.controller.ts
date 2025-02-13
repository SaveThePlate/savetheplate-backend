import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Req,
  Param,
  NotFoundException,
  Patch,
  Delete,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('offers')
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createOfferDto: CreateOfferDto, @Req() req) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);

    // Safely parse the images
    let images = [];
    if (createOfferDto.images) {
      try {
        images = JSON.parse(createOfferDto.images);
      } catch (error) {
        console.error('Error parsing images:', error);
      }
    }

    const data = {
      ownerId: userId,
      title: createOfferDto.title,
      description: createOfferDto.description,
      price: createOfferDto.price,
      quantity: createOfferDto.quantity,
      expirationDate: createOfferDto.expirationDate,
      pickupLocation: user.location,
      mapsLink: user.mapsLink,
      latitude: user.latitude,
      longitude: user.longitude,
      images: images,
    };

    return this.offerService.create(data);
  }

  @Get('owner/:id')
  @UseGuards(AuthGuard)
  async findAllByOwnerId(@Param('id') ownerId: string) {
    const ownerIdNumber = parseInt(ownerId, 10);
    if (isNaN(ownerIdNumber)) {
      throw new NotFoundException('Invalid owner ID');
    }
    return this.offerService.findAllByOwnerId(ownerIdNumber);
  }

  @Get()
  async findAll() {
    return this.offerService.findAll();
  }

  @Patch(':id/quantity')
  async updateOfferQuantity(
    @Param('id') offerId: number,
    @Body('quantity') newQuantity: number,
  ) {
    return this.offerService.updateOfferQuantity(Number(offerId), newQuantity);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Param('id') id: string, @Req() req) {
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      throw new NotFoundException('Invalid offer id');
    }
    return this.offerService.findOfferById(offerId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteOffer(@Param('id') id: string) {
    const offerId = parseInt(id, 10);
    await this.offerService.deleteOffer(offerId);
    return { message: 'Offer deleted successfully' };
  }
}
