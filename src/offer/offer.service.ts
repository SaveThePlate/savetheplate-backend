import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OfferService {

  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.offer.create({
      data: {
        owner: data.owner, 
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        expirationDate: data.expirationDate,
        pickupLocation: data.pickupLocation,
        latitude: data.latitude,   
        longitude: data.longitude, 
        images: data.images,
      },
    });
  }

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

  async findAllByOwner(ownerEmail: string) {
    return this.prisma.offer.findMany({
      where: {
        owner: ownerEmail,
      },
    });
  }

  async findAllByOwnerId(ownerId: number) {
    return this.prisma.offer.findMany({
      where: {
        ownerId: ownerId, 
      },
    });
  }
  async findOfferById(id: number) {
    return this.prisma.offer.findUnique({
      where: {
        id: id,
      },
    });
  }

}
