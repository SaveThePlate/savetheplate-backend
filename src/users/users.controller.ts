import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { User, UserRole } from '@prisma/client';
import { UpdateDetailsDto } from './dto/update-details.dto';


interface ProfileData {
  username?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  phoneNumber?: string;
  profileImage?: string; 

}


interface ProfileData {
  username?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  phoneNumber?: string;
  profileImage?: string; 

}

@UseGuards(AuthGuard) 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body('email') email: string) {
      const username = email.split('@')[0];
      const data = {
          email: email,
          username: username,
          role: UserRole.NONE, 
      };  
      return this.usersService.create(data);
  }


  @Post('set-role')
  async setRole(@Body('role') role: 'CLIENT' | 'PROVIDER', @Req() req) {
      const userId = req.user.id; // Extract userId from the token
      try {
          let redirectTo = '/'; // Default to home
          await this.usersService.updateRole(userId, role);

          if (role === 'PROVIDER') {
              redirectTo = '/provider/home'; // Redirect to profile for providers
          }
          else {
            redirectTo = '/client/home';
          }

          return {
              message: 'Role updated successfully',
              redirectTo, 
          };
      } catch (error) {
          console.error('Error updating user role:', error);
          return { message: 'Failed to update user role', error: error.message };
      }
  }

  @Put('update-details')
  async updateLocation(@Body() updateDetailsDto: UpdateDetailsDto, @Req() req) {
    const userId = req.user.id; 

    return this.usersService.updateDetails(
      userId,
      updateDetailsDto.location,
      updateDetailsDto.longitude,
      updateDetailsDto.latitude,
      updateDetailsDto.phoneNumber,
      updateDetailsDto.mapsLink
    );
  }
  
  @Get('get-role') 
  async getCurrentUserRole(@Req() req) {
    const userId = req.user.id; 
    try {
      const user = await this.usersService.findById(userId); 
      if (!user) {
        return { message: 'User not found' };
      }
      return {
        role: user.role, 
        message: 'User role retrieved successfully',
      };
    } catch (error) {
      console.error('Error retrieving user role:', error);
      return { message: 'Failed to retrieve user role', error: error.message };
    }
  }

  // async updateUserProfileImage(email: string, imagePath: string) {
  //   return this.usersService.updateUserProfileImage(email, imagePath); 
  // }

  // //this is not working correctly
  // @Post('upload-profile-image')
  // @UseInterceptors(FileInterceptor('profileImage', {
  //   storage: diskStorage({
  //     destination: './uploads/profile-images', // Ensure this folder exists
  //     filename: (req, file, cb) => {
  //       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //       const ext = path.extname(file.originalname); // Get the file extension
  //       const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  //       cb(null, filename);
  //     }
  //   }),
  //   limits: {
  //     fileSize: 5 * 1024 * 1024, // Set file size limit to 5MB
  //   },
  //   fileFilter: (req, file, cb) => {
  //     const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  //     if (allowedMimeTypes.includes(file.mimetype)) {
  //       cb(null, true);
  //     } else {
  //       cb(new BadRequestException('Invalid file type'), false);
  //     }
  //   }
  // }))
  // async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
  //   if (!file) {
  //     throw new BadRequestException('No file uploaded');
  //   }
  // //this is not working correctly
  // @Post('upload-profile-image')
  // @UseInterceptors(FileInterceptor('profileImage', {
  //   storage: diskStorage({
  //     destination: './uploads/profile-images', // Ensure this folder exists
  //     filename: (req, file, cb) => {
  //       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //       const ext = path.extname(file.originalname); // Get the file extension
  //       const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  //       cb(null, filename);
  //     }
  //   }),
  //   limits: {
  //     fileSize: 5 * 1024 * 1024, // Set file size limit to 5MB
  //   },
  //   fileFilter: (req, file, cb) => {
  //     const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  //     if (allowedMimeTypes.includes(file.mimetype)) {
  //       cb(null, true);
  //     } else {
  //       cb(new BadRequestException('Invalid file type'), false);
  //     }
  //   }
  // }))
  // async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
  //   if (!file) {
  //     throw new BadRequestException('No file uploaded');
  //   }

  //   const user = req.user as { email: string }; // Ensure the user email is correctly extracted from the request
  //   if (!user || !user.email) {
  //     throw new BadRequestException('Invalid user authentication');
  //   }
  //   const user = req.user as { email: string }; // Ensure the user email is correctly extracted from the request
  //   if (!user || !user.email) {
  //     throw new BadRequestException('Invalid user authentication');
  //   }

  //   const imagePath = `/uploads/profile-images/${file.filename}`; // Use the path where the file was saved
  //   await this.updateUserProfileImage(user.email, imagePath); // Update the user's profile image path in the database
  //   const imagePath = `/uploads/profile-images/${file.filename}`; // Use the path where the file was saved
  //   await this.updateUserProfileImage(user.email, imagePath); // Update the user's profile image path in the database

  //   return { success: true, imagePath }; // Return the image path to the frontend
  // }
  //   return { success: true, imagePath }; // Return the image path to the frontend
  // }
  


  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('providers')
  async findAllProviders() {
    return await this.usersService.findAllProviders();
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
     @Body() profileData: ProfileData,
     @Req() req: Request
   ) {
     const user = req.user as { email: string };
     
     const updatedData: Partial<ProfileData> = {
       username: profileData.username,
       location: profileData.location,
       phoneNumber: profileData.phoneNumber,
     };
 
     if (profileData.profileImage) {
       try {
         updatedData.profileImage = JSON.parse(profileData.profileImage);
       } catch (error) {
         throw new BadRequestException('Invalid profile image data');
       }
     }
 
     try {
       return await this.usersService.updateUserProfile(user.email, updatedData);
     } catch (error) {
       throw new InternalServerErrorException('Failed to update profile');
     }
   }


  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }


}
