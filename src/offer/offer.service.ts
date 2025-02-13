import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  async shortenUrl(longUrl: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`,
      );
      return response.data; // The shortened URL
    } catch (error) {
      console.error('Error shortening URL:', error);
      return longUrl; // Fallback to the original URL
    }
  }
  async create(data: any) {
    const shortenedLink = await this.shortenUrl(data.mapsLink);
    return this.prisma.offer.create({
      data: {
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        price: data.price,
        expirationDate: data.expirationDate,
        pickupLocation: data.pickupLocation,
        mapsLink: shortenedLink,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images,
        quantity: data.quantity,
      },
    });
  }

  async findAll() {
    const offers = await this.prisma.offer.findMany();
    return offers.map((offer) => {
      const imageFileName = offer.images[0].filename;
      return {
        ...offer,
        imageFileName,
      };
    });
  }

  async findAllByOwnerId(ownerId: number) {
    return this.prisma.offer.findMany({
      where: {
        ownerId,
      },
    });
  }

  async findOfferById(id: number) {
    const offer = await this.prisma.offer.findUnique({
      where: {
        id,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async updateOfferQuantity(offerId: number, newQuantity: number) {
    const offer = await this.findOfferById(offerId);

    return this.prisma.offer.update({
      where: { id: offerId },
      data: {
        quantity: newQuantity,
      },
    });
  }

  // async updateOffer(data: any) {

  //   return this.prisma.offer.update({
  //     where: { id: data.offerId },
  //     data: {
  //       title: data.title,
  //       description: data.description,
  //       price: data.price,
  //       expirationDate: data.expirationDate,
  //       pickupLocation: data.pickupLocation,
  //       quantity: data.newQuantity,
  //     },
  //   });

  // }

  async deleteOffer(offerId: number) {
    try {
      const offer = await this.prisma.offer.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      await this.prisma.offer.delete({
        where: { id: offerId },
      });

      return { message: 'Offer deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete offer: ${error.message}`);
    }
  }
}
