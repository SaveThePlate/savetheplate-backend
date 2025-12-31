/**
 * Script to send a test auth email by bootstrapping the NestJS app
 * 
 * Usage:
 *   npm run build && node -r tsconfig-paths/register dist/src/scripts/send-test-auth-email.js
 *   OR
 *   ts-node -r tsconfig-paths/register src/scripts/send-test-auth-email.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';

const TEST_EMAIL = 'sarrasoussia2001@gmail.com';

async function sendTestAuthEmail() {
  try {
    console.log(`📧 Sending test auth email to ${TEST_EMAIL}...`);
    
    // Bootstrap the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get the auth service
    const authService = app.get(AuthService);

    // Send the magic link email
    const result = await authService.AuthMagicMailSender({
      email: TEST_EMAIL,
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.magicLink) {
      console.log('\n🔗 Magic Link:', result.magicLink);
    }

    // Close the app
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

sendTestAuthEmail();
