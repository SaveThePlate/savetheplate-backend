import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '@prisma/client';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createOfferDto: CreateOfferDto, @Req() request: Request) {
    const user: User = request['user'];
    const data = {
      owner: user.email, 
      title: createOfferDto.title,
      description: createOfferDto.description,
      expirationDate: createOfferDto.expirationDate,
      pickupLocation: createOfferDto.pickupLocation,
      latitude: createOfferDto.latitude,     
      longitude: createOfferDto.longitude,   
      images: JSON.parse(createOfferDto.images),
    };

    return this.offerService.create(data);
  }

  @Get('owner')
  @UseGuards(AuthGuard)
  async findAllByOwner(@Req() request: Request) {
    const user: User = request['user'];
    return this.offerService.findAllByOwner(user.email);
  }

  @Get()
  async findAll() {
    return this.offerService.findAll();
  }


}
