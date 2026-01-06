import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, basename, join } from 'path';
import { Request } from 'express';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // Ensure the store directory exists when the controller is initialized
  onModuleInit() {
    const dir = './store';
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      // Log but don't crash here; Multer will surface errors if directory is unusable
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Could not create store directory:', errorMessage);
    }
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './store',
        filename: (req, file, callback) => {
          // Use a UUID with the original extension to avoid collisions and path traversal
          const originalExt = extname(file.originalname || '').toLowerCase();
          const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
          if (!allowedExts.includes(originalExt)) {
            return callback(new Error('Only image files are allowed!'), '');
          }
          const uniqueName = `${uuidv4()}${originalExt}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Check both mimetype and extension for basic validation
        const allowedMime = ['image/jpeg', 'image/png', 'image/gif'];
        const originalExt = extname(file.originalname || '').toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
        if (
          !allowedMime.includes(file.mimetype) ||
          !allowedExts.includes(originalExt)
        ) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        // 5 MB per file
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      if (!files || files.length === 0) {
        throw new InternalServerErrorException('No files uploaded');
      }

      // Process all uploaded files
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          return await this.storageService.processUploadedFile(file);
        }),
      );

      // Return a clean response with just the necessary data
      const baseUrl = (
        process.env.BACKEND_URL ||
        ''
      ).replace(/\/$/, '');
      return processedFiles.map((file) => {
        const filename = file.filename;
        // Utiliser /store/ au lieu de /storage/ pour servir directement via nginx
        const urlPath = `/store/${filename}`;
        const absoluteUrl = baseUrl ? `${baseUrl}${urlPath}` : urlPath;
        return {
          filename,
          originalName: (file as any)?.originalname || null,
          path: `store/${filename}`,
          url: urlPath,
          absoluteUrl,
          blurhash: file.blurhash,
          width: file.width,
          height: file.height,
        };
      });
    } catch (error) {
      console.error('Upload error:', error);
      // Map some common errors to better HTTP responses
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Only image files are allowed')) {
        throw new BadRequestException(errorMessage);
      }
      throw new InternalServerErrorException(
        `Upload failed: ${errorMessage}`,
      );
    }
  }

  @Get('*')
  seeUploadedFile(@Req() req: Request, @Res() res) {
    try {
      // Extract the path part after /storage/ (controller is mounted on /storage)
      const original = (req.originalUrl || req.url).split('?')[0];
      // original may be like '/storage/./groceries.jpg' or '/storage/groceries.jpg'
      const after = original.replace(/^\/storage\/?/, '');

      // Normalize and sanitize: get only the basename (prevents traversal)
      const filename = basename(after || '');

      if (!filename || ['undefined', 'null'].includes(filename)) {
        throw new NotFoundException();
      }

      const root = join(process.cwd(), 'store');
      const filePath = join(root, filename);

      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .json({ message: { statusCode: 404, error: 'Not Found' } });
      }

      return res.sendFile(filename, { root }, function (err) {
        if (err) {
          return res
            .status(404)
            .json({ message: { statusCode: 404, error: 'Not Found' } });
        }
      });
    } catch (error) {
      return res
        .status(404)
        .json({ message: { statusCode: 404, error: 'Not Found' } });
    }
  }
}
