import { Injectable } from '@nestjs/common';
import { encode } from 'blurhash';
import * as fs from 'fs';
import * as sharp from 'sharp';
@Injectable()
export class StorageService {
  async processUploadedFile(file: Express.Multer.File) {
    try {
      const fileBuffer = await fs.promises.readFile(`./store/${file.filename}`);
      const { data: pixels, info: metadata } = await sharp(fileBuffer)
        .raw()
        .ensureAlpha()
        .resize(1500, 1500, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .toBuffer({ resolveWithObject: true });
      const clamped = new Uint8ClampedArray(pixels);
      const blurhash = await encode(
        clamped,
        metadata.width,
        metadata.height,
        6,
        4,
      );
      return {
        ...file,
        blurhash,
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      console.error(error);
      return {
        filename: 'fallback.jpg',
        blurhash: 'L5Q,E.0000x]=e-V-;0K.9.SXm_N',
        width: 640,
        height: 640,
      };
    }
  }
}