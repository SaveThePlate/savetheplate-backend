import { Injectable, ConflictException, BadRequestException, NotFoundException, UploadedFile } from '@nestjs/common';
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

async updateDetails(id: number, location: string, longitude: number, latitude: number, phoneNumber: number, mapsLink: string) {
  return this.prisma.user.update({
      where: { id: id },
      data: { 
              latitude: latitude,   
              longitude: longitude, 
              location: location,
              phoneNumber: phoneNumber,
              mapsLink: mapsLink
            } 
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
    await this.prisma.user.delete({
      where: { email },
    });
  }



}