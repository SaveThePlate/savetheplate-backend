import { Controller, Post, Body, Get } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto) {
    const data = {
      title: createOfferDto.title,
      description: createOfferDto.description,
      expirationDate: createOfferDto.expirationDate,
      pickupLocation: createOfferDto.pickupLocation,
      images: JSON.parse(createOfferDto.images),

    };

    return this.offerService.create(data);
  }

  @Get()
  findAll() {
    return this.offerService.findAll();
  }
}
