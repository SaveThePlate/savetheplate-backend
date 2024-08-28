import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';

@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  // async create(createOfferDto: CreateOfferDto) {
  //   return this.prisma.offer.create({
  //     data: createOfferDto,
  //   });
  // }
  async create(data: any) {
    return this.prisma.offer.create({
      data: {
        owner: data.owner, 
        title: data.title,
        description: data.description,
        expirationDate: data.expirationDate,
        pickupLocation: data.pickupLocation,
        images: data.images,
      },
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
