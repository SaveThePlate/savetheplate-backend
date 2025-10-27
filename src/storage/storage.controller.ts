import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

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
          const finalFilename = file.originalname;
          callback(null, finalFilename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
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
        })
      );
      
      // Return a clean response with just the necessary data
      return processedFiles.map(file => ({
        filename: file.filename,
        path: `store/${file.filename}`,
        url: `/storage/${file.filename}`,
        blurhash: file.blurhash,
        width: file.width,
        height: file.height,
      }));
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }
  }
  
  @Get(':path')
  seeUploadedFile(@Param('path') fileName, @Res() res) {
    if (['undefined', 'null'].includes(fileName)) {
      throw new NotFoundException();
    } else {
      try {
        return res.sendFile(fileName, { root: './store' }, function (err) {
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

}
