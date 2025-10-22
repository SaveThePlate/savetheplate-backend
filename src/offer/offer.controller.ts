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
      console.log('📦 Creating offer...', { userId: req.user.id, body: createOfferDto });
      
      const userId = req.user.id;
      const user = await this.usersService.findById(userId);
      console.log('👤 User found:', { id: user.id, location: user.location, mapsLink: user.mapsLink });

      // Safely parse the images
      let images = [];
      if (createOfferDto.images) {
        try {
          images = JSON.parse(createOfferDto.images);
          console.log('🖼️ Parsed images:', images);
        } catch (error) {
          console.error('❌ Error parsing images:', error);
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

      console.log('💾 Data to save:', data);
      const result = await this.offerService.create(data);
      console.log('✅ Offer created:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
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
}
