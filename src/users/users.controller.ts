import {
  BadRequestException,
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

  //the signIn throught the magic link will set an automatic username 
  @Post()
  async create(@Body('email') email: string) {
    const username = email.split('@')[0];
    const data = {
      email: email, 
      username: username
    };
    return this.usersService.create(data);
  }

    //this is not working correctly
    @Post('upload-profile-image')
    @UseInterceptors(FileInterceptor('profileImage'))
    async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
      const user = req.user as { email: string };
      const imagePath = file.filename; 
  
      return this.usersService.updateUserProfileImage(user.email, imagePath);
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
    @Body() profileData: any,
    @Req() req: Request
  ) {
  async updateProfile(
    @Body() profileData: any,
    @Req() req: Request
  ) {
    const user = req.user as { email: string };
  

  

    return this.usersService.updateUserProfile(user.email, {
      username: profileData.username,
      location: profileData.location,
      phoneNumber: profileData.phoneNumber,
      profileImage: JSON.parse(profileData.profileImage), 
    });
  }



  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }


}
