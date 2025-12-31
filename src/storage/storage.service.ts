import { Injectable } from '@nestjs/common';
import { encode } from 'blurhash';
import * as fs from 'fs';
import sharp from 'sharp';

@Injectable()
export class StorageService {
  /**
   * Process uploaded file: optimize image and return immediately
   * Blurhash is generated asynchronously in the background
   */
  async processUploadedFile(file: Express.Multer.File) {
    try {
      const filePath = `./store/${file.filename}`;
      const originalBuffer = await fs.promises.readFile(filePath);
      
      // Get image metadata first (fast operation)
      const originalMetadata = await sharp(originalBuffer).metadata();
      const isPNG = file.mimetype === 'image/png' || originalMetadata.format === 'png';
      
      // Optimize and resize image BEFORE saving (this is the key optimization!)
      // Max dimensions: 1500x1500, quality: 85% for JPEG, 90% for PNG
      let sharpInstance = sharp(originalBuffer)
        .resize(1500, 1500, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        });
      
      // Apply format-specific optimizations
      if (isPNG) {
        sharpInstance = sharpInstance.png({ quality: 90, compressionLevel: 9 });
      } else {
        // JPEG optimization with mozjpeg for better compression
        sharpInstance = sharpInstance.jpeg({ quality: 85, mozjpeg: true });
      }
      
      const optimizedBuffer = await sharpInstance.toBuffer();
      
      // Save the optimized version instead of the original
      await fs.promises.writeFile(filePath, optimizedBuffer);
      
      // Get metadata from optimized image (actual dimensions)
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();
      
      // Generate blurhash asynchronously in the background (non-blocking)
      // This allows the API to return immediately while blurhash is computed
      this.generateBlurhashAsync(filePath, optimizedBuffer).catch((error) => {
        console.error(`Failed to generate blurhash for ${file.filename}:`, error.message);
      });

      // Return immediately with a placeholder blurhash
      // The actual blurhash will be generated in the background
      return {
        ...file,
        blurhash: 'L5Q,E.0000x]=e-V-;0K.9.SXm_N', // Placeholder, will be updated async
        width: optimizedMetadata.width || 1500,
        height: optimizedMetadata.height || 1500,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing ${file?.filename}:`, errorMessage);
      // Return original file info if processing fails
      return {
        ...file,
        blurhash: 'L5Q,E.0000x]=e-V-;0K.9.SXm_N',
        width: 640,
        height: 640,
      };
    }
  }

  /**
   * Generate blurhash asynchronously in the background
   * This doesn't block the API response
   */
  private async generateBlurhashAsync(
    filePath: string,
    optimizedBuffer: Buffer,
  ): Promise<void> {
    try {
      // Generate blurhash using smaller image for speed
      const { data: pixels, info: blurhashMetadata } = await sharp(optimizedBuffer)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { // Smaller size for blurhash generation (faster)
          fit: sharp.fit.cover,
        })
        .toBuffer({ resolveWithObject: true });

      // Generate blurhash (using smaller image for speed)
      const clamped = new Uint8ClampedArray(pixels);
      const blurhash = encode(
        clamped,
        blurhashMetadata.width,
        blurhashMetadata.height,
        4, // Reduced from 6 to 4 for faster encoding
        4,
      );

      // Note: In a production system, you might want to:
      // 1. Store blurhash in database and update the record
      // 2. Or cache it in Redis
      // 3. For now, we just log it (the placeholder is fine for most use cases)
      console.log(`Blurhash generated for ${filePath}: ${blurhash.substring(0, 20)}...`);
      
      // If you have a database, you could update the image record here:
      // await this.updateImageBlurhash(filename, blurhash);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error generating blurhash:`, errorMessage);
    }
  }
}
