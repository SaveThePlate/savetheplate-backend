import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Redirect('/api', 301)
  root() {
    // Redirect root to Swagger API documentation
  }

  @Get('health')
  async health() {
    // Basic health check - doesn't require database
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unknown' as string,
    };

    // Try to check database connection (non-blocking)
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    return health;
  }
}
