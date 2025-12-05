import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return this.prisma.contactMessage.create({
      data: {
        name: createContactDto.name,
        email: createContactDto.email,
        subject: createContactDto.subject || 'Contact Form Submission',
        message: createContactDto.message,
        userRole: createContactDto.userRole || 'GUEST',
        userId: createContactDto.userId || null,
      },
    });
  }

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.contactMessage.findUnique({
      where: { id },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }
}

