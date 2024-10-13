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
import { User } from '@prisma/client';
import { diskStorage } from 'multer';
import path from 'path';


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


  async updateUserProfileImage(email: string, imagePath: string) {
    return this.usersService.updateUserProfileImage(email, imagePath); 
  }

  //this is not working correctly
  @Post('upload-profile-image')
  @UseInterceptors(FileInterceptor('profileImage', {
    storage: diskStorage({
      destination: './uploads/profile-images', // Ensure this folder exists
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname); // Get the file extension
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // Set file size limit to 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    }
  }))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const user = req.user as { email: string }; // Ensure the user email is correctly extracted from the request
    if (!user || !user.email) {
      throw new BadRequestException('Invalid user authentication');
    }

    const imagePath = `/uploads/profile-images/${file.filename}`; // Use the path where the file was saved
    await this.updateUserProfileImage(user.email, imagePath); // Update the user's profile image path in the database

    return { success: true, imagePath }; // Return the image path to the frontend
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

   //get user by Id
   @Get(':id')
   async getUserById(@Param('id') id: string) {
     return this.usersService.findById(parseInt(id, 10)); 
   }
   
  @Put('me')
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
