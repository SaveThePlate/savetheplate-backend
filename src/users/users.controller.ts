import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard) 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body('email') email: string) {
    const username = email.split('@')[0];
    const data = {
      email: email, 
      username: username
    };
    return this.usersService.create(data);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }
  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = req.user as { email: string };
    return this.usersService.findOne(user.email);
  }

  @Put('me')
  async updateProfile(
    @Req() req: Request, 
    @Body() profileData: any
  ) {
    const user = req.user as { email: string };
    return this.usersService.updateUserProfile(user.email, profileData);
  }
  
  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }


}
