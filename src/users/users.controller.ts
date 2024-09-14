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
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Request } from 'express';


@ApiTags('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBody({
    schema: { type: 'object', properties: { email: { type: 'string' } } },
  })
  async create(@Body('email') email: string) {
    return await this.usersService.create(email);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({
    schema: { type: 'object', properties: { email: { type: 'string' } } },
  })
  async update(@Param('id') id: string, @Body('email') email: string) {
    return await this.usersService.update(+id, email);
  }

  @Put('profile/:id')
  async updateProfile(@Param('id') id: number, @Body() body: { username?: string; location?: string; phoneNumber?: string }) {
    const profileData = { ...body };
    return await this.usersService.updateUserProfile(+id, profileData);
  }
  
  @Get(':id')
  @ApiParam({ name: 'id', type: 'number' })
  async findOne(@Param('id') id: number) {
    return await this.usersService.findOneById(+id);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'number' })
  async remove(@Param('id') id: number) {
    return await this.usersService.remove(+id);
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = req.user as { email: string };
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await this.usersService.findOne(user.email);
  }
}
