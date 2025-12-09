import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import axios from 'axios';
@Injectable()
export class OfferService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AppWebSocketGateway))
    private wsGateway: AppWebSocketGateway,
  ) {}

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
      // If shortening fails, return a truncated version to fit in DB
      return longUrl.substring(0, 250); // Fallback to truncated URL
    }
  }
  async create(data: any) {
    // Only shorten URL if mapsLink is provided
    const shortenedLink = data.mapsLink
      ? await this.shortenUrl(data.mapsLink)
      : '';

    const offer = await this.prisma.offer.create({
      data: {
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        expirationDate: data.expirationDate,
        pickupStartTime: data.pickupStartTime
          ? new Date(data.pickupStartTime)
          : null,
        pickupEndTime: data.pickupEndTime ? new Date(data.pickupEndTime) : null,
        mapsLink: shortenedLink,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images,
        quantity: data.quantity,
        foodType: data.foodType || 'other',
        taste: data.taste || 'neutral',
      },
      include: {
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

    // Format offer like findAll() does for consistency
    // Use owner's location (no pickupLocation field in offer)
    const formattedOffer = {
      ...offer,
      pickupLocation: offer.owner?.location || '',
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
    };

    // Emit real-time update
    try {
      this.wsGateway.emitOfferUpdate(formattedOffer, 'created');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    return formattedOffer;
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
        // Use owner's location (no pickupLocation field in offer)
        pickupLocation: offer.owner?.location || '',
        // Prioritize offer's specific mapsLink over owner's general mapsLink
        mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
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

    // Use owner's location (no pickupLocation field in offer)
    return offers.map((offer) => ({
      ...offer,
      pickupLocation: offer.owner?.location || '',
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
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

    // Prioritize offer's specific pickupLocation over owner's general location
    return {
      ...offer,
      pickupLocation: (offer.pickupLocation && offer.pickupLocation.trim() !== '') ? offer.pickupLocation : (offer.owner?.location || offer.pickupLocation),
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
    };
  }

  async updateOfferQuantity(offerId: number, newQuantity: number) {
    await this.findOfferById(offerId);

    const offer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        quantity: newQuantity,
      },
      include: {
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

    // Format offer like findAll() does for consistency
    const formattedOffer = {
      ...offer,
      pickupLocation: offer.owner?.location || '',
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
    };

    // Emit real-time update when quantity changes
    this.wsGateway.emitOfferUpdate(formattedOffer, 'updated');

    return offer;
  }

  async updateOffer(data: any) {
    const updateData: any = {};

    // Only include fields that are provided (not undefined)
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || ''; // Allow empty description
    }
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    if (data.originalPrice !== undefined) {
      updateData.originalPrice = data.originalPrice;
    }
    if (data.expirationDate !== undefined) {
      // Convert string to Date if needed
      updateData.expirationDate =
        data.expirationDate instanceof Date
          ? data.expirationDate
          : new Date(data.expirationDate);
    }
    if (data.pickupStartTime !== undefined) {
      updateData.pickupStartTime = data.pickupStartTime
        ? data.pickupStartTime instanceof Date
          ? data.pickupStartTime
          : new Date(data.pickupStartTime)
        : null;
    }
    if (data.pickupEndTime !== undefined) {
      updateData.pickupEndTime = data.pickupEndTime
        ? data.pickupEndTime instanceof Date
          ? data.pickupEndTime
          : new Date(data.pickupEndTime)
        : null;
    }
    // pickupLocation is always set from user's profile in controller, don't allow override here
    // pickupLocation removed - always use owner's location
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }
    if (data.latitude !== undefined) {
      updateData.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
      updateData.longitude = data.longitude;
    }
    // mapsLink is always set from user's profile in controller, don't allow override here
    // (removed - mapsLink comes from user profile)
    if (data.foodType !== undefined) {
      updateData.foodType = data.foodType;
    }
    if (data.taste !== undefined) {
      updateData.taste = data.taste;
    }

    // Include images if provided
    if (data.images !== undefined) {
      updateData.images = data.images;
    }

    const offer = await this.prisma.offer.update({
      where: { id: data.offerId },
      data: updateData,
      include: {
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

    // Format offer like findAll() does for consistency
    // Use owner's location (no pickupLocation field in offer)
    const formattedOffer = {
      ...offer,
      pickupLocation: offer.owner?.location || '',
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
    };

    // Emit real-time update
    try {
      this.wsGateway.emitOfferUpdate(formattedOffer, 'updated');
    } catch (error) {
      // Silently fail - WebSocket updates are not critical
    }

    // Return formatted offer with owner info, matching findOfferById format
    // Use owner's location (no pickupLocation field in offer)
    return {
      ...offer,
      pickupLocation: offer.owner?.location || '',
      mapsLink: (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink),
    };
  }

  async deleteOffer(offerId: number) {
    try {
      const offer = await this.prisma.offer.findUnique({
        where: { id: offerId },
        include: {
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
        throw new Error('Offer not found');
      }

      // Delete dependent orders first to avoid foreign key constraint errors.
      // Use a transaction to ensure both operations succeed or both fail.
      await this.prisma.$transaction([
        this.prisma.order.deleteMany({ where: { offerId } }),
        this.prisma.offer.delete({ where: { id: offerId } }),
      ]);

      // Format offer like findAll() does for consistency before emitting
      const formattedOffer = {
        ...offer,
        pickupLocation: offer.owner?.location || '',
        mapsLink: offer.owner?.mapsLink || offer.mapsLink || '',
      };

      // Emit real-time update (before deletion, so we have the data)
      this.wsGateway.emitOfferUpdate(formattedOffer, 'deleted');

      return { message: 'Offer deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete offer: ${error.message}`);
    }
  }
}
