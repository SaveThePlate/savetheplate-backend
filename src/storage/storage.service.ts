import { Injectable } from '@nestjs/common';
import { encode } from 'blurhash';
import * as fs from 'fs';
import * as sharp from 'sharp';

@Injectable()
export class StorageService {
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

      return {
        ...file,
        blurhash,
        width: optimizedMetadata.width || 1500,
        height: optimizedMetadata.height || 1500,
      };
    } catch (error) {
      console.error(`Error processing ${file?.filename}:`, error.message);
      // Return original file info if processing fails
      return {
        ...file,
        blurhash: 'L5Q,E.0000x]=e-V-;0K.9.SXm_N',
        width: 640,
        height: 640,
      };
    }
  }
}
