import { Module } from '@nestjs/common';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [PassportModule.register({ session: false }), ConfigModule.forRoot({ isGlobal: true }), UsersModule],
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService,  GoogleStrategy]
})
export class GoogleAuthModule {}
