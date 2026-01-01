import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.logger.error(
        '❌ DATABASE_URL environment variable is not set. Please set it in your .env file.',
      );
      this.logger.warn(
        '⚠️  Database operations will fail until DATABASE_URL is configured.',
      );
      this.logger.warn(
        '💡 Example DATABASE_URL format: postgresql://user:password@localhost:5432/database',
      );
      return;
    }

    // Validate DATABASE_URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      this.logger.error(
        `❌ Invalid DATABASE_URL format. Expected postgresql:// or postgres://, got: ${databaseUrl.substring(0, 20)}...`,
      );
      return;
    }

    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error: any) {
      // Provide more specific error messages
      let errorMessage = '❌ Failed to connect to database';
      
      if (error?.code === 'ECONNREFUSED') {
        errorMessage += ': Connection refused. Is PostgreSQL running?';
      } else if (error?.code === 'ENOTFOUND') {
        errorMessage += ': Database host not found. Check your DATABASE_URL.';
      } else if (error?.code === 'P1001') {
        errorMessage += ': Cannot reach database server. Check if PostgreSQL is running and accessible.';
      } else if (error?.kind === 'Closed') {
        errorMessage += ': Connection closed. Check your DATABASE_URL and ensure PostgreSQL is running.';
      } else if (error?.code === '3D000') {
        errorMessage += ': Database does not exist. Create the database first.';
      } else if (error?.code === '28P01') {
        errorMessage += ': Authentication failed. Check your username and password in DATABASE_URL.';
      } else {
        errorMessage += `: ${error?.message || JSON.stringify(error)}`;
      }

      this.logger.error(errorMessage);
      if (error?.stack) {
        this.logger.debug('Error stack:', error.stack);
      }
      
      // Don't throw - allow app to start but log the error
      // The app can still run, but database operations will fail
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }
}
