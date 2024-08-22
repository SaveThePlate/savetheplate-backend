import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
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
          const fileExtName = extname(file.originalname);
          const finalFilename = file.originalname; 

          console.log('Generated filename:', finalFilename);
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.storageService.processUploadedFile(file);
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
