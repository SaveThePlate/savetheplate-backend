import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resendInstance: Resend;
  private readonly logger = new Logger(ResendService.name);

  constructor() {
    const apiKey = process.env.RESEND_TOKEN;
    if (!apiKey) {
      this.logger.warn('RESEND_TOKEN is not set. Email sending will fail.');
    }
    this.resendInstance = new Resend(apiKey);
    
    // Only try to create domain if RESEND_DOMAIN is set
    // Note: This might fail if domain already exists, which is fine
    if (process.env.RESEND_DOMAIN) {
      this.resendInstance.domains
        .create({ name: process.env.RESEND_DOMAIN })
        .catch((error) => {
          // Domain might already exist, which is fine
          if (!error.message?.includes('already exists')) {
            this.logger.warn('Failed to create Resend domain:', error.message);
          }
        });
    }
  }

  getResendInstance(): Resend {
    return this.resendInstance;
  }
}
