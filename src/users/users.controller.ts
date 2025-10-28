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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
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
    const userId = req.user.id;
    try {
      let redirectTo = '/';
      await this.usersService.updateRole(userId, role);

      if (role === 'PROVIDER') {
        redirectTo = '/provider/profile';
      } else {
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

  @Post('update-details')
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

  @Post('me')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './store/profile-images',
        filename: (req, file, callback) => {
          const fileExtName = extname(file.originalname);
          const uniqueName = `${Date.now()}${fileExtName}`;
          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updateProfile(
    @UploadedFile() profileImage: Express.Multer.File,
    @Body() profileData: ProfileData,
    @Req() req: Request,
  ) {
    const user = req.user as { email: string };

    const updatedData: Partial<ProfileData> = {
      username: profileData.username,
      location: profileData.location,
      phoneNumber: profileData.phoneNumber,
    };

    if (profileImage) {
      updatedData.profileImage = `/store/profile-images/${profileImage.filename}`; // Save file path
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