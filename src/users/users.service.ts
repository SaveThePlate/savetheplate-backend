import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
 
  async create(data: any) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        profileImage: data.profileImage,
      },
    });
  }

  async updateUserProfile(email: string, profileData: any) {
    try {
      return await this.prisma.user.update({
        where: { email },
        data: profileData,
      });
    } catch (error) {
      console.error("Prisma update error:", error);
      throw new Error("Failed to update user profile.");
    }
  }
  

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(email: string) {
    const user = this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(email: string) {
    await this.prisma.user.delete({
      where: { email },
    });
  }


}
