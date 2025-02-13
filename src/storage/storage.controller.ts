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
          const fileExtName = extname(file.originalname); // Get the file extension
          const uniqueName = `${Date.now()}${fileExtName}`; // Generate a unique filename based on timestamp
        
          callback(null, uniqueName);
        }
        
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, callback) => {
        
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        
        callback(null, true); // Proceed with the file if it's valid
      }
      
      
    }),
  )
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    console.log('Received file:', files); // Log the file object to check its properties
    // 
    try {
      return files.map(file => ({ filePath: `store/${file.filename}` })); // Return paths
    } catch (error) {
      console.error("Image upload error:", error);
      throw new InternalServerErrorException('Failed to process the image upload');
    }
  }
  

  @Get(':path')
  seeUploadedFile(@Param('path') fileName, @Res() res) {
    if ( !fileName || fileName === 'undefined' || fileName === 'null' ) {
      throw new NotFoundException('Invalid file path');
    // }
    
    }
    const filePath = `./store/${fileName}`;

    return res.sendFile( filePath, { root: '.' }, function(err){
      if (err) {
        return res
          .status(404)
          .json({ message: 'File not found' });
      }
    });

  }

}
