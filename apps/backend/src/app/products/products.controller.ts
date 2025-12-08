import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import { UploadsService } from '../uploads/uploads.service';
import {
  CreateProductDto,
  CreateVariantDto,
  ProductFilterDto,
  UpdateProductDto,
} from './dtos';
import { ProductsService } from './products.service';
import { ImagesRepository } from './repositories';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadsService: UploadsService,
    private readonly imagesRepository: ImagesRepository
  ) {}

  @Get()
  findAll(@Query() filters: ProductFilterDto) {
    return this.productsService.findAll(filters);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Variant endpoints
  @Post(':productId/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto
  ) {
    return this.productsService.addVariant(productId, dto);
  }

  @Patch('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: Partial<CreateVariantDto>
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  // Image endpoints - Upload single image
  @Post(':productId/images/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('productId') productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      })
    )
    file: any,
    @Body('isMain') isMain?: boolean
  ) {
    const uploadResult = await this.uploadsService.uploadImage(
      file,
      'products',
      {
        quality: 'auto',
        format: 'auto',
      }
    );
    return this.productsService.addImage(
      productId,
      uploadResult.url,
      isMain,
      uploadResult.publicId
    );
  }

  // Image endpoints - Upload multiple images
  @Post(':productId/images/upload-multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadMultipleImages(
    @Param('productId') productId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB por imagen
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      })
    )
    files: any[],
    @Body('setFirstAsMain') setFirstAsMain?: boolean
  ) {
    const uploadResults = await this.uploadsService.uploadMultipleImages(
      files,
      'products',
      {
        quality: 'auto',
        format: 'auto',
      }
    );

    const results = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];
      const isMain = setFirstAsMain && i === 0;
      const image = await this.productsService.addImage(
        productId,
        result.url,
        isMain,
        result.publicId
      );
      results.push(image);
    }

    return results;
  }

  // Image endpoints - Add image by URL (for backward compatibility)
  @Post(':productId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addImage(
    @Param('productId') productId: string,
    @Body('url') url: string,
    @Body('isMain') isMain?: boolean
  ) {
    return this.productsService.addImage(productId, url, isMain);
  }

  @Patch('images/:imageId/main')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  setMainImage(@Param('imageId') imageId: string) {
    return this.productsService.setMainImage(imageId);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeImage(@Param('imageId') imageId: string) {
    // Get image first to check for publicId before deletion
    const image = await this.imagesRepository.findById(imageId);

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Store publicId before deletion
    const publicId = (image as { publicId?: string | null }).publicId;

    // Delete from database
    await this.productsService.removeImage(imageId);

    // Si la imagen tiene publicId de Cloudinary, eliminarla también
    if (publicId) {
      try {
        await this.uploadsService.deleteImage(publicId);
      } catch (error) {
        // Log error but don't fail the request
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    return { message: 'Imagen eliminada correctamente' };
  }
}
