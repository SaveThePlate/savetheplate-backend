import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Req,
  Param,
  NotFoundException,
  ForbiddenException,
  Patch,
  Delete,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto/create-offer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from '../users/users.service';

@Controller('offers')
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createOfferDto: CreateOfferDto, @Req() req) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Safely parse the images
    let images = [];
    if (createOfferDto.images) {
      try {
        images = JSON.parse(createOfferDto.images);
      } catch (error) {
        throw new Error('Invalid images format');
      }
    }

    // Normalize image entries so DB stores a canonical structure
    const backendBase = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      ''
    ).replace(/\/$/, '');
    const normalizedImages = (images || []).map((img: any) => {
      // img may be a string or an object like { path: './groceries.jpg' }
      let candidate = img;
      if (typeof img === 'object' && img !== null) {
        candidate =
          img.path ||
          img.relativePath ||
          img.filename ||
          img.url ||
          img.absoluteUrl ||
          '';
      }
      candidate = String(candidate || '')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '');
      const filename = candidate.split('/').filter(Boolean).pop() || '';
      const url = filename ? `/storage/${encodeURIComponent(filename)}` : null;
      const absoluteUrl = url
        ? backendBase
          ? `${backendBase}${url}`
          : url
        : null;
      return {
        filename: filename || null,
        path: filename ? `store/${filename}` : null,
        url,
        absoluteUrl,
        original: img,
      };
    });

    // Always use user's profile mapsLink (location comes from user profile, not stored in offer)
    const data = {
      ownerId: userId,
      title: createOfferDto.title,
      description: createOfferDto.description || '', // Allow empty description
      price: createOfferDto.price,
      originalPrice: createOfferDto.originalPrice,
      quantity: createOfferDto.quantity,
      expirationDate: createOfferDto.expirationDate,
      pickupStartTime: createOfferDto.pickupStartTime,
      pickupEndTime: createOfferDto.pickupEndTime,
      mapsLink: user.mapsLink || '', // Always from user profile
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      images: normalizedImages,
      foodType: createOfferDto.foodType,
      taste: createOfferDto.taste,
    };

    return await this.offerService.create(data);
  }

  @Get()
  async findAll() {
    return this.offerService.findAll();
  }

  @Get('owner/:id')
  @UseGuards(AuthGuard)
  async findAllByOwnerId(@Param('id') ownerId: string) {
    const ownerIdNumber = parseInt(ownerId, 10);
    if (isNaN(ownerIdNumber)) {
      throw new NotFoundException('Invalid owner ID');
    }
    return this.offerService.findAllByOwnerId(ownerIdNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      throw new NotFoundException('Invalid offer id');
    }
    return this.offerService.findOfferById(offerId);
  }

  @Patch(':id/quantity')
  @UseGuards(AuthGuard)
  async updateOfferQuantity(
    @Param('id') offerId: string,
    @Body('quantity') newQuantity: number,
    @Req() req,
  ) {
    const id = parseInt(offerId, 10);
    if (isNaN(id)) {
      throw new NotFoundException('Invalid offer id');
    }

    const offer = await this.offerService.findOfferById(id);
    if (offer.ownerId !== req.user.id) {
      throw new ForbiddenException('You cannot update this offer');
    }

    return this.offerService.updateOfferQuantity(id, newQuantity);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteOffer(@Param('id') id: string, @Req() req) {
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      throw new NotFoundException('Invalid offer id');
    }

    const offer = await this.offerService.findOfferById(offerId);
    if (offer.ownerId !== req.user.id) {
      throw new ForbiddenException('You cannot delete this offer');
    }

    await this.offerService.deleteOffer(offerId);
    return { message: 'Offer deleted successfully' };
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async updateOffer(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req,
  ) {
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      throw new NotFoundException('Invalid offer id');
    }

    const offer = await this.offerService.findOfferById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.ownerId !== req.user.id) {
      throw new ForbiddenException('You cannot edit this offer');
    }

    // Handle images if provided
    let images = undefined;
    if (
      updateData.images !== undefined &&
      updateData.images !== null &&
      updateData.images !== ''
    ) {
      try {
        // If images is a string, parse it; otherwise use it directly
        let parsedImages;
        if (typeof updateData.images === 'string') {
          parsedImages = JSON.parse(updateData.images);
        } else if (Array.isArray(updateData.images)) {
          parsedImages = updateData.images;
        } else {
          parsedImages = null;
        }

        if (
          parsedImages &&
          Array.isArray(parsedImages) &&
          parsedImages.length > 0
        ) {
          // Normalize image entries like in create
          const backendBase = (
            process.env.BACKEND_URL ||
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            ''
          ).replace(/\/$/, '');
          const normalizedImages = parsedImages.map((img: any) => {
            let candidate = img;
            if (typeof img === 'object' && img !== null) {
              candidate =
                img.path ||
                img.relativePath ||
                img.filename ||
                img.url ||
                img.absoluteUrl ||
                '';
            }
            candidate = String(candidate || '')
              .replace(/^\.\//, '')
              .replace(/^\/+/, '');
            const filename = candidate.split('/').filter(Boolean).pop() || '';
            const url = filename
              ? `/storage/${encodeURIComponent(filename)}`
              : null;
            const absoluteUrl = url
              ? backendBase
                ? `${backendBase}${url}`
                : url
              : null;
            return {
              filename: filename || null,
              path: filename ? `store/${filename}` : null,
              url,
              absoluteUrl,
              original: img,
            };
          });
          images = normalizedImages;
        } else {
          // Empty array or invalid format - don't update images
          images = undefined;
        }
      } catch (error) {
        // If parsing fails, keep existing images (don't update)
        images = undefined;
      }
    }

    const dataToUpdate: any = { ...updateData };
    // Remove images from updateData before passing to service
    delete dataToUpdate.images;
    
    // Remove mapsLink - it should always come from user's profile
    delete dataToUpdate.mapsLink;
    
    // Handle foodType and taste if provided
    if (updateData.foodType !== undefined) {
      dataToUpdate.foodType = updateData.foodType;
    }
    if (updateData.taste !== undefined) {
      dataToUpdate.taste = updateData.taste;
    }
    
    // Always use user's profile mapsLink for updates
    const user = await this.usersService.findById(req.user.id);
    if (user) {
      dataToUpdate.mapsLink = user.mapsLink || '';
      dataToUpdate.latitude = user.latitude || null;
      dataToUpdate.longitude = user.longitude || null;
    }

    // Handle mapsLink - shorten it if provided (similar to create)
    if (dataToUpdate.mapsLink !== undefined && dataToUpdate.mapsLink) {
      try {
        const shortenedLink = await this.offerService.shortenUrl(
          dataToUpdate.mapsLink,
        );
        dataToUpdate.mapsLink = shortenedLink;
      } catch (error) {
        // If shortening fails, truncate to fit in DB
        dataToUpdate.mapsLink = dataToUpdate.mapsLink.substring(0, 250);
      }
    }

    // Add offerId and images if provided
    dataToUpdate.offerId = offerId;
    if (images !== undefined) {
      dataToUpdate.images = images;
    }

    try {
      // Return the updated offer with all fields including images array
      // This ensures the frontend receives the complete updated offer data
      const updatedOffer = await this.offerService.updateOffer(dataToUpdate);
      return updatedOffer;
    } catch (error) {
      throw new NotFoundException(error.message || 'Failed to update offer');
    }
  }
}
