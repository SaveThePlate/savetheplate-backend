import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt')) 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body('email') email: string) {
    const data = {
      email: email, 
      username: email.split('@')[0]
    };
    return this.usersService.create(data);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Put('profile/:id')
  async updateProfile(@Param('id') id: number, @Body() profileData: any) {
    return this.usersService.updateUserProfile(id, profileData);
  }

  
  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = req.user as { email: string };
    return this.usersService.findOne(user.email);
  }
}
