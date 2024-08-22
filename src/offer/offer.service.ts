import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';

@Injectable()
export class OfferService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOfferDto: CreateOfferDto) {
    return this.prisma.offer.create({
      data: createOfferDto,
    });
  }

  // async findAll() {
  //   return this.prisma.offer.findMany();
  // }

  async findAll() {
    const offers = await this.prisma.offer.findMany();
    return offers.map(offer => {
      const imageFileName =  offer.images[0].filename;
      return {
        ...offer,
        imageFileName: imageFileName,
      };
    });
  }

}
