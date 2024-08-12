import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(email: string): Promise<User> {
    try {
      return await this.prismaService.user.create({
        data: { email },
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
    }
  }

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

  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany();
  }

  async findOne(email: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: number): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.user.delete({
      where: { id },
    });
  }

  private handleUniqueConstraintError(error: any) {
    if (error.code === 'P2002') {
      throw new ConflictException('Unique constraint failed');
    }
    throw error;
  }

}