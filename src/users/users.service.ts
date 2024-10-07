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

  async updateUserProfileImage(email: string, imagePath: string) {
    return this.prisma.user.update({
      where: { email },
      data: { profileImage: imagePath },
    });
  }

  async updateUserProfile(email: string, profileData: any) {
    return this.prisma.user.update({
      where: { email },
      data: {
        username: profileData.username,
        location: profileData.location,
        phoneNumber: profileData.phoneNumber,
        profileImage: profileData.profileImage,
      },

    });

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

  findById(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId, 
      },
    });
  }

  async remove(email: string) {
    await this.prisma.user.delete({
      where: { email },
    });
  }



}
