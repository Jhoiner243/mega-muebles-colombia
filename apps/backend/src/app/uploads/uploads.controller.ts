import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { DeleteImageDto } from './dtos';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      })
    )
    file: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('width') width?: number,
    @Body('height') height?: number
  ) {
    return this.uploadsService.uploadImage(file, folder || 'products', {
      width,
      height,
      quality: 'auto',
      format: 'auto',
    });
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Máximo 10 imágenes
  async uploadMultipleImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB por imagen
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      })
    )
    files: Express.Multer.File[],
    @Body('folder') folder?: string,
    @Body('width') width?: number,
    @Body('height') height?: number
  ) {
    return this.uploadsService.uploadMultipleImages(
      files,
      folder || 'products',
      {
        width,
        height,
        quality: 'auto',
        format: 'auto',
      }
    );
  }

  @Delete('image/:publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    await this.uploadsService.deleteImage(publicId);
    return { message: 'Imagen eliminada correctamente' };
  }

  @Delete('images')
  async deleteMultipleImages(@Body() dto: DeleteImageDto) {
    await this.uploadsService.deleteMultipleImages(dto.publicIds);
    return { message: 'Imágenes eliminadas correctamente' };
  }
}
