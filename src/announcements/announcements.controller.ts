import {
  Body,
  Controller,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post('send')
  @UseGuards(AuthGuard, AdminGuard)
  // TODO: Replace AdminGuard with RolesGuard + ADMIN role when admin system is implemented
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  async sendAnnouncement(@Body() dto: SendAnnouncementDto) {
    return this.announcementsService.sendAnnouncement(dto);
  }

  @Post('test')
  async testAnnouncement(@Body() dto: SendAnnouncementDto) {
    // Test endpoint - only available in development mode
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Test endpoint is not available in production',
      );
    }
    return this.announcementsService.sendAnnouncement(dto);
  }
}
