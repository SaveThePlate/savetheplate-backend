import { Controller, Post, Body, Get, UseGuards, Req, Param, NotFoundException } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Offer, User } from '@prisma/client';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createOfferDto: CreateOfferDto, @Req() request: Request) {
    const user: User = request['user'];
    const data = {
      ownerId: user.id,
      title: createOfferDto.title,
      description: createOfferDto.description,
      price: createOfferDto.price,
      expirationDate: createOfferDto.expirationDate,
      pickupLocation: createOfferDto.pickupLocation,
      latitude: createOfferDto.latitude,     
      longitude: createOfferDto.longitude,   
      images: JSON.parse(createOfferDto.images),
    };

    return this.offerService.create(data);
  }

  // @Get('owner')
  // @UseGuards(AuthGuard)
  // async findAllByOwner(@Req() request: Request) {
  //   const user: User = request['user'];
  //   return this.offerService.findAllByOwner(user.id);
  // }

  @Get('owner/:id')
  @UseGuards(AuthGuard)
  async findAllByOwnerId(@Param('id') ownerId: string) {
    return this.offerService.findAllByOwnerId(parseInt(ownerId, 10)); 
  }
  

  @Get()
  async findAll() {
    return this.offerService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Param('id') id: number, @Req() req: Request) {
    console.log("offer id from backend ", id);
    return this.offerService.findOfferById(Number(id));
  }


}
