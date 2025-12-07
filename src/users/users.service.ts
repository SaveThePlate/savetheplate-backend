import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        profileImage: data.profileImage,
        role: data.role,
        mapsLink: data.mapsLink,
      },
    });
  }

  async updateRole(userId: number, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role },
    });
  }

  async updateDetails(
    id: number,
    location: string,
    longitude: number,
    latitude: number,
    phoneNumber: string | number,
    mapsLink: string,
  ) {
    // Convert phoneNumber to number if it's a string
    const parsedPhoneNumber =
      typeof phoneNumber === 'string' ? parseInt(phoneNumber, 10) : phoneNumber;

    return this.prisma.user.update({
      where: { id },
      data: {
        latitude,
        longitude,
        location,
        phoneNumber: parsedPhoneNumber,
        mapsLink,
      },
    });
  }

  async updateUserProfile(email: string, profileData: any) {
    const updateData: any = {
      username: profileData.username,
      location: profileData.location,
      phoneNumber: profileData.phoneNumber,
    };

    // Only include profileImage if it's provided (not undefined)
    if (profileData.profileImage !== undefined) {
      updateData.profileImage = profileData.profileImage;
    }

    // Include mapsLink if provided
    if (profileData.mapsLink !== undefined) {
      updateData.mapsLink = profileData.mapsLink;
    }

    return this.prisma.user.update({
      where: { email },
      data: updateData,
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findAllProviders() {
    return await this.prisma.user.findMany({ where: { role: 'PROVIDER' } });
  }

  async findOne(email: string) {
    const user = this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findById(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async remove(email: string) {
    // First, find the user to get their ID
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all offers owned by this user
    const userOffers = await this.prisma.offer.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    const offerIds = userOffers.map((offer) => offer.id);

    // Use a transaction to ensure all deletions succeed or all fail
    await this.prisma.$transaction(async (tx) => {
      // Delete all orders associated with the user's offers
      if (offerIds.length > 0) {
        await tx.order.deleteMany({
          where: { offerId: { in: offerIds } },
        });
      }

      // Delete all orders placed by the user
      await tx.order.deleteMany({
        where: { userId: user.id },
      });

      // Delete all offers owned by the user
      if (offerIds.length > 0) {
        await tx.offer.deleteMany({
          where: { ownerId: user.id },
        });
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });
  }
}
