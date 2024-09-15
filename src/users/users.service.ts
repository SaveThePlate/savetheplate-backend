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
    const updateData = {
      ...profileData,
    };
    return this.prisma.user.update({
      where: { email }, 
      data: updateData,
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

  async remove(email: string) {
    await this.prisma.user.delete({
      where: { email },
    });
  }


}
