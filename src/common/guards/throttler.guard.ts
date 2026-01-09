import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends NestThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address for tracking
    // Support both direct connections and proxy setups (X-Forwarded-For)
    const ip = 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';
    
    return ip;
  }
}

