import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}

  async shortenUrl(longUrl: string): Promise<string> {
    try {
      // Ensure URL has protocol
      let fullUrl = longUrl;
      if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
        fullUrl = 'https://' + longUrl;
      }

      const response = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`,
      );
      return response.data; // The shortened URL
    } catch (error) {
      console.error('Error shortening URL:', error);
      // If shortening fails, return a truncated version to fit in DB
      return longUrl.substring(0, 250); // Fallback to truncated URL
    }
  }
  async create(data: any) {
    // Only shorten URL if mapsLink is provided
    const shortenedLink = data.mapsLink
      ? await this.shortenUrl(data.mapsLink)
      : '';

    return this.prisma.offer.create({
      data: {
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
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
    const offers = await this.prisma.offer.findMany({
      include: {
        // Include owner (provider) information to always get fresh data
        owner: {
          select: {
            id: true,
            username: true,
            location: true,
            phoneNumber: true,
            mapsLink: true,
            profileImage: true,
          },
        },
      },
    });
    return offers.map((offer) => {
      // images may be undefined or an empty array for some offers.
      // Guard access to avoid runtime errors and provide a sensible fallback.
      const imageFileName =
        Array.isArray(offer.images) && offer.images.length > 0
          ? ((offer.images as any)[0]?.filename ?? null)
          : null;

      return {
        ...offer,
        imageFileName,
        // Use current owner location if available, otherwise fallback to stored pickupLocation
        pickupLocation: offer.owner?.location || offer.pickupLocation,
        // Use current owner mapsLink if available, otherwise fallback to stored mapsLink
        mapsLink: offer.owner?.mapsLink || offer.mapsLink,
        // Include owner info for frontend
        owner: offer.owner,
      };
    });
  }

  async findAllByOwnerId(ownerId: number) {
    const offers = await this.prisma.offer.findMany({
      where: {
        ownerId,
      },
      include: {
        // Include owner information to get fresh provider data
        owner: {
          select: {
            id: true,
            username: true,
            location: true,
            phoneNumber: true,
            mapsLink: true,
            profileImage: true,
          },
        },
      },
    });
    
    // Update offers with current owner location and mapsLink
    return offers.map((offer) => ({
      ...offer,
      pickupLocation: offer.owner?.location || offer.pickupLocation,
      mapsLink: offer.owner?.mapsLink || offer.mapsLink,
    }));
  }

  async findOfferById(id: number) {
    const offer = await this.prisma.offer.findUnique({
      where: {
        id,
      },
      include: {
        // Include owner (provider) information to always get fresh data
        owner: {
          select: {
            id: true,
            username: true,
            location: true,
            phoneNumber: true,
            mapsLink: true,
            profileImage: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Use current owner location if available, otherwise fallback to stored pickupLocation
    return {
      ...offer,
      pickupLocation: offer.owner?.location || offer.pickupLocation,
      mapsLink: offer.owner?.mapsLink || offer.mapsLink,
    };
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

  async updateOffer(data: any) {
    return this.prisma.offer.update({
      where: { id: data.offerId },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        expirationDate: data.expirationDate,
        pickupLocation: data.pickupLocation,
        quantity: data.quantity,
      },
    });
  }

  async deleteOffer(offerId: number) {
    try {
      const offer = await this.prisma.offer.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Delete dependent orders first to avoid foreign key constraint errors.
      // Use a transaction to ensure both operations succeed or both fail.
      await this.prisma.$transaction([
        this.prisma.order.deleteMany({ where: { offerId } }),
        this.prisma.offer.delete({ where: { id: offerId } }),
      ]);

      return { message: 'Offer deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete offer: ${error.message}`);
    }
  }
}
