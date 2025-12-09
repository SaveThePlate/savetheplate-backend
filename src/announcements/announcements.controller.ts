import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post('send')
  @UseGuards(AuthGuard)
  async sendAnnouncement(@Body() dto: SendAnnouncementDto) {
    return this.announcementsService.sendAnnouncement(dto);
  }

  @Post('test')
  async testAnnouncement(@Body() dto: SendAnnouncementDto) {
    // Test endpoint without authentication for testing purposes
    return this.announcementsService.sendAnnouncement(dto);
  }
}
