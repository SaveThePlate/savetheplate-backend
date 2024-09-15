import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
 
  async create(data: any) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
      },
    });
  }

  async updateUserProfile(id: number, profileData: any) {
    return this.prisma.user.update({
      where: { id },
      data: profileData,
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async remove(email: string) {
    await this.prisma.user.delete({
      where: { email },
    });
  }


}
