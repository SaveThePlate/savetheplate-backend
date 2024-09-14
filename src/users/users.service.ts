import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create user with only email
  async create(email: string): Promise<User> {
    try {
      return await this.prismaService.user.create({
        data: { email },
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
    }
  }

  // Update user email only
  async update(id: number, email: string): Promise<User> {
    try {
      return await this.prismaService.user.update({
        where: { id },
        data: { email },
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
    }
  }

  // Update profile fields (username, location, phone number, profile image)
  async updateUserProfile(
    id: number,
    data: { username?: string; location?: string; phoneNumber?: string; profileImage?: string }
  ): Promise<User> {
    try {
      // Check if there is any data to update
      if (!data.username && !data.location && !data.phoneNumber && !data.profileImage) {
        throw new BadRequestException('No data provided for update');
      }

      return await this.prismaService.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
    }
  }

  // Fetch all users
  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany();
  }

  // Find a user by email
  async findOne(email: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { email },
    });
  }

  // Find a user by ID
  async findOneById(id: number): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { id },
    });
  }

  // Delete a user
  async remove(id: number): Promise<void> {
    await this.prismaService.user.delete({
      where: { id },
    });
  }

  // Handle unique constraint error for email and other unique fields
  private handleUniqueConstraintError(error: any) {
    if (error.code === 'P2002') {
      throw new ConflictException('Unique constraint failed');
    }
    throw error;
  }
}
