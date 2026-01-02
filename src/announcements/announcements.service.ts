import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/utils/mailing/resend.service';
import { UserRole } from '@prisma/client';
import AnnouncementEmailTemplate from 'src/emails/Announcement';
import { render } from '@react-email/render';
import { SendAnnouncementDto } from './dto/send-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  async sendAnnouncement(dto: SendAnnouncementDto) {
    let users;

    // If specific emails are provided, use those (for testing)
    if (dto.emails && dto.emails.length > 0) {
      const userPromises = dto.emails.map(async (email) => {
        try {
          const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, username: true, role: true },
          });
          if (user) {
            return user;
          }
          // If user doesn't exist, still allow sending to that email (for testing)
          return {
            id: null,
            email: email,
            username: email.split('@')[0],
            role: null,
          };
        } catch (error) {
          // If user doesn't exist, still allow sending to that email (for testing)
          return {
            id: null,
            email: email,
            username: email.split('@')[0],
            role: null,
          };
        }
      });
      users = await Promise.all(userPromises);
    } else {
      // Get users based on role filter
      if (dto.role) {
        users = await this.prisma.user.findMany({
          where: { role: dto.role },
          select: { id: true, email: true, username: true, role: true },
        });
      } else {
        users = await this.prisma.user.findMany({
          select: { id: true, email: true, username: true, role: true },
        });
      }
    }

    if (users.length === 0) {
      throw new BadRequestException('No users found to send emails to');
    }

    // Render email template
    const language = dto.language || 'en';
    const emailHtml = await render(
      AnnouncementEmailTemplate({
        title: dto.title || (language === 'fr' ? '🎉 Des nouvelles excitantes de Save The Plate !' : '🎉 Exciting News from Save The Plate!'),
        description: dto.description,
        details: dto.details || [],
        buttonText: dto.buttonText || (language === 'fr' ? 'Créer votre compte maintenant' : 'Create Your Account Now'),
        buttonLink: dto.buttonLink || 'https://leftover.ccdev.space/',
        language: language,
      }),
    );

    // For local dev: Log instead of sending (unless forceProduction is true)
    if (process.env.NODE_ENV === 'development' && !dto.forceProduction) {
      console.log('\n📧 Announcement Email (Local Dev):');
      console.log('Subject:', dto.subject);
      console.log('Recipients:', users.length);
      console.log('Users:', users.map((u) => u.email).join(', '));
      console.log('Title:', dto.title || '🎉 Exciting News from Save The Plate!');
      console.log('Description:', dto.description);
      return {
        message: `Email would be sent to ${users.length} users in production`,
        sent: 0,
        failed: 0,
        recipients: users.length,
        users: users.map((u) => ({ email: u.email, username: u.username })),
      };
    }

    // Production: Send emails
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Rate limit: Resend allows 2 requests per second, so we'll send 1 per 600ms to be safe
    const delayBetweenEmails = 600; // milliseconds

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Add delay between emails (except for the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
      }

      try {
        const mail_resp = await this.resendService
          .getResendInstance()
          .emails.send({
            from: 'Save The Plate <no-reply@savetheplate.tn>',
            to: user.email,
            subject: dto.subject,
            html: emailHtml,
          });

        if (mail_resp.error) {
          failed++;
          errors.push(`${user.email}: ${mail_resp.error.message}`);
        } else {
          sent++;
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${user.email}: ${errorMessage}`);
      }
    }

    return {
      message: `Email campaign completed`,
      sent,
      failed,
      total: users.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
