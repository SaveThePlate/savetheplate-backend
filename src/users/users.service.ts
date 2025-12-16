import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

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
    try {
      // First verify the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Validate the role is a valid enum value
      if (!Object.values(UserRole).includes(role)) {
        throw new BadRequestException(`Invalid role value: ${role}. Valid values are: ${Object.values(UserRole).join(', ')}`);
      }

      // Update the role
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role: role },
      });
      
      // Invalidate cache
      await this.cacheService.invalidateUsers(userId, user.email);
      
      console.log(`Successfully updated user ${userId} role from ${user.role} to ${role}`);
      return updatedUser;
    } catch (error) {
      console.error(`Error updating role for user ${userId} to ${role}:`, {
        error: error?.message,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack,
      });
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle Prisma-specific errors
      if (error?.code === 'P2002') {
        throw new BadRequestException('Unique constraint violation');
      }
      if (error?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Re-throw with more context as InternalServerErrorException
      throw new InternalServerErrorException(
        `Failed to update user role: ${error?.message || 'Unknown error'}. User ID: ${userId}, Role: ${role}, Error Code: ${error?.code || 'N/A'}`,
      );
    }
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

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        latitude,
        longitude,
        location,
        phoneNumber: parsedPhoneNumber,
        mapsLink,
      },
    });

    // Update all offers for this provider with the new mapsLink
    // Note: pickupLocation is no longer stored in offers - always uses owner.location
    try {
      await this.prisma.offer.updateMany({
        where: { ownerId: id },
        data: {
          mapsLink: mapsLink || '',
          latitude: latitude || null,
          longitude: longitude || null,
        },
      });
    } catch (error) {
      // Log error but don't fail the profile update
      console.error('Error updating offers after profile mapsLink change:', error);
    }

    // Invalidate cache
    await this.cacheService.invalidateUsers(id);
    await this.cacheService.invalidateOffers(); // Offers may have changed

    return updatedUser;
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

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    // If mapsLink changed, update all offers for this provider
    // Note: pickupLocation is no longer stored in offers - always uses owner.location
    if (profileData.mapsLink !== undefined) {
      try {
        // Update all offers for this user with the new mapsLink
        await this.prisma.offer.updateMany({
          where: { ownerId: updatedUser.id },
          data: {
            mapsLink: updatedUser.mapsLink || '',
            latitude: updatedUser.latitude || null,
            longitude: updatedUser.longitude || null,
          },
        });
      } catch (error) {
        // Log error but don't fail the profile update
        console.error('Error updating offers after profile mapsLink change:', error);
      }
    }

    // Invalidate cache
    await this.cacheService.invalidateUsers(updatedUser.id, email);
    await this.cacheService.invalidateOffers(); // Offers may have changed

    return updatedUser;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findAllProviders() {
    return await this.prisma.user.findMany({ where: { role: 'PROVIDER' } });
  }

  async findAllByRole(role?: UserRole) {
    if (role) {
      return await this.prisma.user.findMany({ 
        where: { role },
        select: { id: true, email: true, username: true, role: true }
      });
    }
    return await this.prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true }
    });
  }

  async findOne(email: string) {
    const cacheKey = this.cacheService.getUserKey(undefined, email);
    const cached = await this.cacheService.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, user, 300);
    return user;
  }

  async findById(userId: number) {
    const cacheKey = this.cacheService.getUserKey(userId);
    const cached = await this.cacheService.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, user, 300);
    }

    return user;
  }

  async remove(email: string) {
    // First, find the user to get their ID and role
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all offers owned by this user (if they're a provider)
    const userOffers = await this.prisma.offer.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    const offerIds = userOffers.map((offer) => offer.id);

    // Count orders that will be deleted
    const ordersOnOffers =
      offerIds.length > 0
        ? await this.prisma.order.count({
            where: { offerId: { in: offerIds } },
          })
        : 0;

    const ordersByUser = await this.prisma.order.count({
      where: { userId: user.id },
    });

    // Use a transaction to ensure all deletions succeed or all fail
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Delete all orders associated with offers owned by this user
      // This ensures that when we delete the offers, there are no foreign key constraints
      if (offerIds.length > 0) {
        await tx.order.deleteMany({
          where: { offerId: { in: offerIds } },
        });
      }

      // Step 2: Delete all orders placed by the user (as a client)
      // This covers orders the user made on other providers' offers
      await tx.order.deleteMany({
        where: { userId: user.id },
      });

      // Step 3: Delete all offers owned by the user (provider)
      // All related orders have already been deleted in Step 1
      if (offerIds.length > 0) {
        await tx.offer.deleteMany({
          where: { ownerId: user.id },
        });
      }

      // Step 4: Finally, delete the user
      // All related offers and orders have been deleted
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    // Return summary of what was deleted
    return {
      message: 'User and all associated data deleted successfully',
      deleted: {
        user: email,
        offers: userOffers.length,
        ordersOnOffers: ordersOnOffers,
        ordersByUser: ordersByUser,
        totalOrders: ordersOnOffers + ordersByUser,
      },
    };
  }

  async findOneByGoogleId(googleId: string) {
    const user = await this.prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
