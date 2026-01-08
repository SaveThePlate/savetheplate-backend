import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
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
import { render } from '@react-email/render';
import ProviderRegistrationEmail from 'src/emails/ProviderRegistration';

type ReverseGeocodeResponse = {
  city: string;
  state: string;
  locationName?: string;
};

interface ProfileData {
  username?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  phoneNumber?: string;
  profileImage?: string;
  mapsLink?: string;
}
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly resendService: ResendService,
  ) {}

  @Post()
  async create(@Body('email') email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      const username = email.split('@')[0];
      const data = {
        email: email,
        username: username,
        role: UserRole.NONE,
      };
      return await this.usersService.create(data);
    } catch (error) {
      console.error('Error creating user:', error);
      const errorObj = error as any;
      if (errorObj?.code === 'P2002') {
        // Prisma unique constraint violation
        throw new BadRequestException('User with this email already exists');
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to create user: ${errorMessage}`,
      );
    }
  }

  @Post('set-role')
  @UseGuards(AuthGuard)
  async setRole(@Body('role') role: string, @Req() req: Request) {
    // Validate request object exists
    if (!req) {
      throw new BadRequestException('Invalid request object');
    }

    // Validate that user is authenticated
    // The AuthGuard sets req['user'], try both access methods
    let user: any = undefined;
    
    // Try to get user from request - handle both dot and bracket notation
    if (req.user) {
      user = req.user;
    } else if ((req as any)['user']) {
      user = (req as any)['user'];
    }
    
    // Defensive check - ensure user exists
    if (user === undefined || user === null) {
      console.error('User authentication failed - user is null/undefined:', {
        hasReq: !!req,
        hasDotUser: !!req?.user,
        hasBracketUser: !!(req as any)?.['user'],
        reqType: typeof req,
        userType: typeof user,
      });
      throw new BadRequestException('User not authenticated - no user found in request');
    }

    // Safely check for id property - use hasOwnProperty to be extra safe
    let userId: number | undefined = undefined;
    if (user && typeof user === 'object') {
      // Try multiple ways to access the id
      if ('id' in user) {
        const idValue = (user as any).id;
        // Handle both string and number IDs (JWT might have string, DB has number)
        if (typeof idValue === 'number') {
          userId = idValue;
        } else if (typeof idValue === 'string') {
          const parsed = parseInt(idValue, 10);
          if (!isNaN(parsed)) {
            userId = parsed;
          }
        }
      }
    }
    
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      console.error('User authentication failed - no valid user ID:', {
        user: user,
        userId: userId,
        userIdType: typeof userId,
        userKeys: user && typeof user === 'object' ? Object.keys(user) : 'N/A',
        userStringified: JSON.stringify(user, null, 2),
      });
      throw new BadRequestException('User not authenticated - user ID not found or invalid');
    }

    // Validate role parameter
    if (!role || typeof role !== 'string') {
      throw new BadRequestException('Role is required and must be a string');
    }

    const upperRole = role.toUpperCase();
    if (upperRole !== 'CLIENT' && upperRole !== 'PROVIDER') {
      throw new BadRequestException('Role must be either CLIENT or PROVIDER');
    }

    try {
      // Check if user exists before updating
      const dbUser = await this.usersService.findById(userId);
      if (!dbUser) {
        console.error(`User not found for ID: ${userId}`);
        throw new NotFoundException('User not found');
      }

      console.log(`Updating role for user ${userId} (${dbUser.email}) from ${dbUser.role} to ${upperRole}`);

      let redirectTo = '/';
      // Set role to PENDING_PROVIDER for providers - this allows them to onboard quickly
      // They can start using the platform immediately while awaiting admin approval
      let roleToSet: UserRole;
      if (upperRole === 'PROVIDER') {
        roleToSet = UserRole.PENDING_PROVIDER;
      } else if (upperRole === 'CLIENT') {
        roleToSet = UserRole.CLIENT;
      } else {
        throw new BadRequestException(`Invalid role: ${upperRole}`);
      }

      console.log(`Setting role to: ${roleToSet} for user ID: ${userId}`);
      
      // Validate roleToSet is a valid enum value before calling service
      if (!Object.values(UserRole).includes(roleToSet)) {
        console.error(`Invalid role value: ${roleToSet}. Valid values: ${Object.values(UserRole).join(', ')}`);
        throw new BadRequestException(`Invalid role value: ${roleToSet}`);
      }

      const updatedUser = await this.usersService.updateRole(userId, roleToSet);
      console.log(`Role updated successfully. User ID: ${userId}, New role: ${updatedUser.role}`);

      if (upperRole === 'PROVIDER') {
        // Don't send approval email here - will be sent after provider fills in details
        // This ensures the email contains complete information (phone, location, mapsLink)
        redirectTo = '/provider/home';
      } else {
        redirectTo = '/client/home';
      }

      return {
        message: 'Role updated successfully',
        redirectTo,
        role: roleToSet,
      };
    } catch (error) {
      const errorObj = error as any;
      console.error('Error updating user role:', {
        error: error instanceof Error ? error.message : errorObj?.message || error,
        stack: error instanceof Error ? error.stack : errorObj?.stack,
        userId,
        role: upperRole,
        errorName: errorObj?.name,
        errorCode: errorObj?.code,
        errorConstructor: errorObj?.constructor?.name,
        isHttpException: error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException,
      });
      
      // Re-throw HttpExceptions as-is
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Wrap other errors in InternalServerErrorException
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to update user role: ${errorMessage}`,
      );
    }
  }

  @Get('get-role')
  @UseGuards(AuthGuard)
  async getCurrentUserRole(@Req() req) {
    // Validate that user is authenticated
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    const userId = req.user.id;
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return {
        role: user.role,
        message: 'User role retrieved successfully',
      };
    } catch (error) {
      console.error('Error retrieving user role:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user role');
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
  @UseGuards(AuthGuard)
  async updateLocation(@Body() updateDetailsDto: any, @Req() req) {
    // Validate that user is authenticated
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    const userId = req.user.id;

    // Get user info to check if we need to send approval email
    const user = await this.usersService.findById(userId);
    const isPendingProvider = user?.role === UserRole.PENDING_PROVIDER;

    // Expand and extract data if a Google Maps link is provided
    let latitude = updateDetailsDto.latitude;
    let longitude = updateDetailsDto.longitude;
    let locationName = updateDetailsDto.location;
    const mapsLink = updateDetailsDto.mapsLink;

    if (mapsLink) {
      // IMPORTANT: Never fail onboarding just because Google Maps URL expansion/parsing fails.
      // Mobile share links are often short links (maps.app.goo.gl/...) and expansion can fail
      // depending on network/proxy restrictions. We should still persist the submitted details.
      try {
        const expandedUrl = await this.expandGoogleMapsUrl(mapsLink);
        const data = this.extractLocationData(expandedUrl);

        if (data.latitude && data.longitude) {
          latitude = data.latitude;
          longitude = data.longitude;
        }
        // Only extract location name if it wasn't manually provided
        // This allows users to edit the extracted name and have it preserved
        if (data.locationName && !locationName) {
          locationName = data.locationName;
        }
      } catch (error) {
        console.warn('⚠️ Failed to expand/parse Google Maps link during update-details, continuing anyway:', {
          mapsLink,
          message: error instanceof Error ? error.message : String(error),
        });
        // Keep user-provided locationName/lat/lng as-is.
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

    // If this is a pending provider updating their details for the first time, send approval email
    // This ensures the email contains complete information (phone, location, mapsLink)
    if (isPendingProvider && updateDetailsDto.phoneNumber && mapsLink) {
      console.log('📧 Sending provider approval email with complete details:', {
        userId: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        location: updatedUser.location,
        mapsLink: updatedUser.mapsLink,
      });
      await this.sendProviderApprovalEmail(updatedUser);
    } else {
      console.log('⏭️ Skipping approval email:', {
        isPendingProvider,
        hasPhoneNumber: !!updateDetailsDto.phoneNumber,
        hasMapsLink: !!mapsLink,
        userRole: user?.role,
      });
    }

    return updatedUser;
  }

  private async sendProviderApprovalEmail(user: any) {
    const adminEmail = process.env.ADMIN_EMAILS || 'savetheplatetunisia@gmail.com';
    const subject = 'New Provider Registration - Approval Required';

    // Render React email template to HTML
    const emailHtml = await render(
      ProviderRegistrationEmail({
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        mapsLink: user.mapsLink,
        userId: user.id,
      }),
    );

    try {
      // For local dev: Log the email details
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 Provider Approval Email (Local Dev):');
        console.log('To:', adminEmail);
        console.log('Subject:', subject);
        console.log('Provider Details:', {
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          location: user.location,
          mapsLink: user.mapsLink,
          userId: user.id,
        });
      }

      // Send actual email (works in both dev and production)
      const mail_resp = await this.resendService
        .getResendInstance()
        .emails.send({
          from: 'Save The Plate <no-reply@savetheplate.tn>',
          to: adminEmail,
          subject: subject,
          html: emailHtml,
        });

      if (mail_resp.error) {
        console.error(
          '❌ Error sending provider approval email:',
          mail_resp.error,
        );
      } else {
        console.log('✅ Provider approval email sent successfully to', adminEmail);
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 Email ID:', mail_resp.data?.id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to send provider approval email:', error);
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
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req: Request) {
    // Validate that user is authenticated
    if (!req.user || !(req.user as any).email) {
      throw new BadRequestException('User not authenticated');
    }

    const user = req.user as { email: string };
    return this.usersService.findOne(user.email);
  }

  /**
   * Reverse geocode coordinates to a human-readable city/state.
   *
   * Used by the client home page to show a friendly location label for
   * distance-based browsing. This endpoint is intentionally lightweight and
   * resilient: it never throws for upstream geocoding failures; it returns
   * "Unknown" values instead.
   *
   * Query params:
   * - lat: number
   * - lon: number
   */
  @Get('reverse-geocode')
  async reverseGeocode(
    @Query('lat') latStr: string,
    @Query('lon') lonStr: string,
  ): Promise<ReverseGeocodeResponse> {
    const lat = Number(latStr);
    const lon = Number(lonStr);

    // Validate inputs
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Invalid coordinates');
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new BadRequestException('Coordinates out of range');
    }

    // Default response (safe fallback)
    const fallback: ReverseGeocodeResponse = { city: 'Unknown', state: 'Unknown' };

    try {
      // Use OpenStreetMap Nominatim (no API key). Keep timeout and headers explicit.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          // Nominatim requires a valid User-Agent identifying the application.
          'User-Agent': 'SaveThePlate/1.0 (reverse-geocode)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return fallback;
      }

      const data: any = await res.json();
      const address = data?.address || {};

      // City can be under multiple keys depending on region
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        'Unknown';

      const state =
        address.state ||
        address.region ||
        address.state_district ||
        address.county ||
        'Unknown';

      const locationName = data?.display_name ? String(data.display_name) : undefined;

      return {
        city: String(city || 'Unknown'),
        state: String(state || 'Unknown'),
        ...(locationName ? { locationName } : {}),
      };
    } catch (error) {
      // Never fail the caller; just return Unknown.
      return fallback;
    }
  }

  //get user by Id
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(parseInt(id, 10));
  }

  @Post('me')
  @UseGuards(AuthGuard)
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
    // Validate that user is authenticated
    if (!req.user || !(req.user as any).email) {
      throw new BadRequestException('User not authenticated');
    }

    const user = req.user as { email: string };

    const updatedData: Partial<ProfileData> = {
      username: profileData.username,
      location: profileData.location,
      // phoneNumber may come as a string from the frontend; normalize to Int or null
      // We'll set the field only when provided to avoid sending `undefined` to Prisma.
    };

    // Include mapsLink if provided and extract coordinates
    if (profileData.mapsLink !== undefined && profileData.mapsLink !== null) {
      const mapsLink = profileData.mapsLink.trim();
      updatedData.mapsLink = mapsLink || null;

      // Extract latitude/longitude from mapsLink if provided
      if (mapsLink) {
        try {
          const expandedUrl = await this.expandGoogleMapsUrl(mapsLink);
          const data = this.extractLocationData(expandedUrl);

          if (data.latitude && data.longitude) {
            (updatedData as any).latitude = data.latitude;
            (updatedData as any).longitude = data.longitude;
          }
          // Only extract location name if it wasn't manually provided
          if (data.locationName && !profileData.location) {
            updatedData.location = data.locationName;
          }
        } catch (error) {
          console.warn('⚠️ Failed to expand/parse Google Maps link during profile update, continuing anyway:', {
            mapsLink,
            message: error instanceof Error ? error.message : String(error),
          });
          // Keep user-provided location/lat/lng as-is.
        }
      }
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        'Failed to update profile for',
        user?.email,
        'error:',
        errorMessage,
      );
      throw new InternalServerErrorException(
        errorMessage
          ? `Failed to update profile: ${errorMessage}`
          : 'Failed to update profile',
      );
    }
  }

  @Delete(':email')
  async remove(@Param('email') email: string) {
    return await this.usersService.remove(email);
  }
}
