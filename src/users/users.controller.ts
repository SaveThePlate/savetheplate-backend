import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
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
import { extname } from 'path';
import { UserRole } from '@prisma/client';
import { ResendService } from 'src/utils/mailing/resend.service';

interface ProfileData {
  username?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  phoneNumber?: string;
  profileImage?: string;
  mapsLink?: string;
}
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly resendService: ResendService,
  ) {}

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
      // For providers, set role to PENDING_PROVIDER instead of PROVIDER
      // They need to complete details and wait for admin approval
      const roleToSet =
        role === 'PROVIDER' ? UserRole.PENDING_PROVIDER : UserRole[role];
      await this.usersService.updateRole(userId, roleToSet);

      if (role === 'PROVIDER') {
        redirectTo = '/onboarding/fillDetails';
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

  // @Post('update-details')
  // async updateLocation(@Body() updateDetailsDto: UpdateDetailsDto, @Req() req) {
  //   const userId = req.user.id;

  //   return this.usersService.updateDetails(
  //     userId,
  //     updateDetailsDto.location,
  //     updateDetailsDto.longitude,
  //     updateDetailsDto.latitude,
  //     updateDetailsDto.phoneNumber,
  //     updateDetailsDto.mapsLink
  //   );
  // }

  @Post('update-details')
  async updateLocation(@Body() updateDetailsDto: any, @Req() req) {
    const userId = req.user.id;

    // Get user info to check if they're a pending provider
    const user = await this.usersService.findById(userId);
    const isPendingProvider = user?.role === UserRole.PENDING_PROVIDER;

    // Expand and extract data if a Google Maps link is provided
    let latitude = updateDetailsDto.latitude;
    let longitude = updateDetailsDto.longitude;
    let locationName = updateDetailsDto.location;
    const mapsLink = updateDetailsDto.mapsLink;

    if (mapsLink) {
      const expandedUrl = await this.expandGoogleMapsUrl(mapsLink);
      const data = this.extractLocationData(expandedUrl);

      if (data.latitude && data.longitude) {
        latitude = data.latitude;
        longitude = data.longitude;
      }
      if (data.locationName) {
        locationName = data.locationName;
      }
    }

    const updatedUser = await this.usersService.updateDetails(
      userId,
      locationName,
      longitude,
      latitude,
      updateDetailsDto.phoneNumber,
      mapsLink,
    );

    // If this is a pending provider completing their details, send email to admin
    if (isPendingProvider) {
      await this.sendProviderApprovalEmail(updatedUser);
    }

    return updatedUser;
  }

  private async sendProviderApprovalEmail(user: any) {
    const adminEmail = 'savetheplatetunisia@gmail.com';
    const subject = 'New Provider Registration - Approval Required';

    const emailBody = `
      <h2>New Provider Registration</h2>
      <p>A new food provider has completed their registration and is waiting for approval.</p>
      
      <h3>Provider Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${user.username}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Phone:</strong> ${user.phoneNumber || 'Not provided'}</li>
        <li><strong>Location:</strong> ${user.location || 'Not provided'}</li>
        <li><strong>Maps Link:</strong> <a href="${user.mapsLink}">${user.mapsLink || 'Not provided'}</a></li>
      </ul>
      
      <p>Please review this provider and approve or reject their registration.</p>
      <p><strong>User ID:</strong> ${user.id}</p>
    `;

    try {
      // For local dev: Log the email instead of sending
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 Provider Approval Email (Local Dev):');
        console.log('To:', adminEmail);
        console.log('Subject:', subject);
        console.log('Body:', emailBody);
        return;
      }

      // Production: Send actual email
      const mail_resp = await this.resendService
        .getResendInstance()
        .emails.send({
          from: 'Save The Plate <no-reply@ccdev.space>',
          to: adminEmail,
          subject: subject,
          html: emailBody,
        });

      if (mail_resp.error) {
        console.error(
          'Error sending provider approval email:',
          mail_resp.error,
        );
      } else {
        console.log('Provider approval email sent successfully to', adminEmail);
      }
    } catch (error) {
      console.error('Error sending provider approval email:', error);
    }
  }

  // Helper: expand short URL (handles maps.app.goo.gl, goo.gl, and other short links)
  private async expandGoogleMapsUrl(shortUrl: string): Promise<string> {
    try {
      // If it's already a full URL, return as-is
      if (
        shortUrl.includes('maps.google.com') ||
        shortUrl.includes('google.com/maps')
      ) {
        return shortUrl;
      }

      // For short links, follow redirects manually to get the final URL
      let currentUrl = shortUrl;
      let finalUrl = shortUrl;
      let redirectCount = 0;
      const maxRedirects = 5;

      while (redirectCount < maxRedirects) {
        try {
          const response = await fetch(currentUrl, {
            method: 'HEAD', // Use HEAD to avoid downloading content
            redirect: 'manual', // Don't follow redirects automatically
          });

          // Check if there's a redirect
          if (
            response.status === 301 ||
            response.status === 302 ||
            response.status === 307 ||
            response.status === 308
          ) {
            const location = response.headers.get('location');
            if (location) {
              currentUrl = location.startsWith('http')
                ? location
                : `https://${location}`;
              finalUrl = currentUrl;
              redirectCount++;
            } else {
              break;
            }
          } else {
            // No redirect, this is the final URL
            finalUrl = response.url || currentUrl;
            break;
          }
        } catch (error) {
          // If HEAD fails, try GET with redirect follow
          try {
            const getResponse = await fetch(currentUrl, {
              method: 'GET',
              redirect: 'follow',
            });
            finalUrl = getResponse.url || currentUrl;
            break;
          } catch (getError) {
            console.error('❌ Failed to expand short link:', getError);
            return shortUrl;
          }
        }
      }

      return finalUrl;
    } catch (error) {
      console.error('❌ Failed to expand short link:', error);
      return shortUrl;
    }
  }

  // Helper: extract lat/lng/name from long Google Maps URL
  // Handles all Google Maps URL formats: desktop, mobile, short links, search, etc.
  private extractLocationData(googleMapsUrl: string) {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = googleMapsUrl.match(regex);
    const latitude = match ? parseFloat(match[1]) : null;
    const longitude = match ? parseFloat(match[2]) : null;

    // Try multiple patterns to extract location name (in order of reliability)
    let locationName = '';

    // Pattern 1: maps/place/Name (most common desktop format)
    // Example: https://www.google.com/maps/place/Restaurant+Name/@lat,lng
    const nameRegex1 = /maps\/place\/([^/@?&#]+)/;
    const nameMatch1 = googleMapsUrl.match(nameRegex1);
    if (nameMatch1) {
      try {
        locationName = decodeURIComponent(nameMatch1[1])
          .replace(/\+/g, ' ')
          .trim();
        // Remove trailing slashes or special characters
        locationName = locationName.replace(/\/+$/, '').replace(/^\/+/, '');
      } catch (e) {
        locationName = nameMatch1[1].replace(/\+/g, ' ').trim();
      }
    }

    // Pattern 2: query parameter (common in mobile/share links)
    // Example: https://maps.google.com/?q=Restaurant+Name or ?query=Restaurant+Name
    if (!locationName) {
      const qRegex = /[?&](?:q|query)=([^&]+)/;
      const qMatch = googleMapsUrl.match(qRegex);
      if (qMatch) {
        try {
          locationName = decodeURIComponent(qMatch[1])
            .replace(/\+/g, ' ')
            .trim();
          // Remove coordinates if present in query (format: "Name @lat,lng")
          locationName = locationName.split('@')[0].trim();
        } catch (e) {
          locationName = qMatch[1]
            .replace(/\+/g, ' ')
            .trim()
            .split('@')[0]
            .trim();
        }
      }
    }

    // Pattern 3: maps/search/Name (search format)
    // Example: https://www.google.com/maps/search/Restaurant+Name
    if (!locationName) {
      const nameRegex2 = /maps\/search\/([^/@?&#]+)/;
      const nameMatch2 = googleMapsUrl.match(nameRegex2);
      if (nameMatch2) {
        try {
          locationName = decodeURIComponent(nameMatch2[1])
            .replace(/\+/g, ' ')
            .trim();
        } catch (e) {
          locationName = nameMatch2[1].replace(/\+/g, ' ').trim();
        }
      }
    }

    // Pattern 4: data=!4m...!3m...!1s... (encoded data format, often in mobile links)
    // Example: https://www.google.com/maps/place/?data=!4m2!3m1!1s0x...
    if (!locationName) {
      const dataRegex = /data=!4m[^!]*!3m[^!]*!1s([^!]+)/;
      const dataMatch = googleMapsUrl.match(dataRegex);
      if (dataMatch) {
        try {
          locationName = decodeURIComponent(dataMatch[1])
            .replace(/\+/g, ' ')
            .trim();
        } catch (e) {
          locationName = dataMatch[1].replace(/\+/g, ' ').trim();
        }
      }
    }

    // Pattern 5: cid parameter (place ID format)
    // Example: https://maps.google.com/?cid=123456789
    // Note: This requires API call to resolve, but we can try to extract if available
    if (!locationName) {
      const cidRegex = /[?&]cid=([^&]+)/;
      const cidMatch = googleMapsUrl.match(cidRegex);
      if (cidMatch) {
        // Place ID format - would need Geocoding API to resolve
        // For now, we'll skip this as it requires additional API call
      }
    }

    // Pattern 6: ll parameter with address (legacy format)
    // Example: https://maps.google.com/?ll=lat,lng&q=Restaurant+Name
    if (!locationName) {
      const llQRegex = /[?&]ll=[^&]*&q=([^&]+)/;
      const llQMatch = googleMapsUrl.match(llQRegex);
      if (llQMatch) {
        try {
          locationName = decodeURIComponent(llQMatch[1])
            .replace(/\+/g, ' ')
            .trim();
        } catch (e) {
          locationName = llQMatch[1].replace(/\+/g, ' ').trim();
        }
      }
    }

    // Pattern 7: daddr parameter (directions format)
    // Example: https://maps.google.com/?daddr=Restaurant+Name
    if (!locationName) {
      const daddrRegex = /[?&]daddr=([^&]+)/;
      const daddrMatch = googleMapsUrl.match(daddrRegex);
      if (daddrMatch) {
        try {
          locationName = decodeURIComponent(daddrMatch[1])
            .replace(/\+/g, ' ')
            .trim();
          // Remove coordinates if present
          locationName = locationName.split('@')[0].trim();
        } catch (e) {
          locationName = daddrMatch[1]
            .replace(/\+/g, ' ')
            .trim()
            .split('@')[0]
            .trim();
        }
      }
    }

    // Pattern 8: saddr parameter (starting address, sometimes used for places)
    if (!locationName) {
      const saddrRegex = /[?&]saddr=([^&]+)/;
      const saddrMatch = googleMapsUrl.match(saddrRegex);
      if (saddrMatch) {
        try {
          locationName = decodeURIComponent(saddrMatch[1])
            .replace(/\+/g, ' ')
            .trim();
          locationName = locationName.split('@')[0].trim();
        } catch (e) {
          locationName = saddrMatch[1]
            .replace(/\+/g, ' ')
            .trim()
            .split('@')[0]
            .trim();
        }
      }
    }

    // Clean up the location name
    if (locationName) {
      // Remove common prefixes/suffixes that might be in URLs
      locationName = locationName
        .replace(/^place\//i, '')
        .replace(/^search\//i, '')
        .replace(/^dir\//i, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        // Remove coordinate strings that might be embedded
        .replace(/@-?\d+\.\d+,-?\d+\.\d+/g, '')
        .trim();
    }

    return { latitude, longitude, locationName };
  }

  @Post('extract-location')
  async extractLocation(@Body() body: { mapsLink: string }) {
    const { mapsLink } = body;
    let locationName = '';

    if (mapsLink) {
      try {
        // First, try to expand if it's a short link
        const expandedUrl = await this.expandGoogleMapsUrl(mapsLink);

        // Extract location data from the expanded URL
        const data = this.extractLocationData(expandedUrl);
        locationName = data.locationName || '';

        // If extraction failed, try extracting from original URL as fallback
        // (sometimes the expansion might not work, but original URL has the data)
        if (!locationName) {
          const originalData = this.extractLocationData(mapsLink);
          locationName = originalData.locationName || '';
        }

        // Clean up the location name
        if (locationName) {
          // Remove any remaining URL encoding artifacts
          locationName = locationName
            .replace(/%20/g, ' ')
            .replace(/%2C/g, ',')
            .replace(/%2F/g, '/')
            .replace(/\+/g, ' ')
            .trim();
        }
      } catch (error) {
        console.error('Error extracting location:', error);
        // Try extracting from original URL as last resort
        try {
          const fallbackData = this.extractLocationData(mapsLink);
          locationName = fallbackData.locationName || '';
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
      }
    }

    return { locationName };
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
      // phoneNumber may come as a string from the frontend; normalize to Int or null
      // We'll set the field only when provided to avoid sending `undefined` to Prisma.
    };

    // Include mapsLink if provided
    if (profileData.mapsLink !== undefined && profileData.mapsLink !== null) {
      updatedData.mapsLink = profileData.mapsLink.trim() || null;
    }

    // Normalize and add phoneNumber only when present
    if (
      profileData.phoneNumber !== undefined &&
      profileData.phoneNumber !== null &&
      profileData.phoneNumber !== ''
    ) {
      // Strip non-digits and parse as integer
      const digits = String(profileData.phoneNumber).replace(/\D/g, '');
      const parsed = digits ? parseInt(digits, 10) : NaN;
      (updatedData as any).phoneNumber = Number.isNaN(parsed) ? null : parsed;
    }

    // Handle profileImage: can come as file upload OR as string (filename from storage/upload)
    if (profileImage) {
      // File was uploaded directly - save it
      updatedData.profileImage = `/store/profile-images/${profileImage.filename}`;
      console.log(
        '📤 Profile image uploaded as file:',
        updatedData.profileImage,
      );
    } else if (profileData.profileImage) {
      // profileImage was sent as string (filename from storage/upload endpoint)
      // Use it as-is - it should already be in the correct format
      updatedData.profileImage = profileData.profileImage;
      console.log('📤 Profile image sent as string:', updatedData.profileImage);
    } else {
      console.log('⚠️ No profileImage provided in request');
    }

    console.log('📤 Final updatedData:', JSON.stringify(updatedData, null, 2));

    try {
      return await this.usersService.updateUserProfile(user.email, updatedData);
    } catch (error) {
      // Log detailed error server-side for debugging and return a helpful message
      console.error(
        'Failed to update profile for',
        user?.email,
        'error:',
        error?.message || error,
      );
      throw new InternalServerErrorException(
        error?.message
          ? `Failed to update profile: ${error.message}`
          : 'Failed to update profile',
      );
    }
  }

  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }
}
