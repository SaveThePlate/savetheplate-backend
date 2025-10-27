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
    try {
      const userId = req.user.id;
      const user = await this.usersService.findById(userId);

      // Safely parse the images
      let images = [];
      if (createOfferDto.images) {
        try {
          images = JSON.parse(createOfferDto.images);
        } catch (error) {
          throw new Error('Invalid images format');
        }
      }

      const data = {
        ownerId: userId,
        title: createOfferDto.title,
        description: createOfferDto.description,
        price: createOfferDto.price,
        quantity: createOfferDto.quantity,
        expirationDate: createOfferDto.expirationDate,
        pickupLocation: user.location || '',
        mapsLink: user.mapsLink || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        images: images,
      };

      return await this.offerService.create(data);
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
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

@UseGuards(AuthGuard)
@Put(':id')
async updateOffer(@Param('id') id: string, @Body() updateData: any, @Req() req) {
  const offerId = parseInt(id, 10);
  if (isNaN(offerId)) throw new NotFoundException('Invalid offer id');

  const offer = await this.offerService.findOfferById(offerId);
  if (!offer) throw new NotFoundException('Offer not found');

  if (offer.ownerId !== req.user.id)
    throw new NotFoundException('You cannot edit this offer');

  return this.offerService.updateOffer({ ...updateData, offerId });
}

}
