import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resendInstance: Resend;

  constructor() {
    this.resendInstance = new Resend(process.env.RESEND_TOKEN);
    this.resendInstance.domains.create({ name: process.env.RESEND_DOMAIN });
  }

  getResendInstance(): Resend {
    return this.resendInstance;
  }
}
