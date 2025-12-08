import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { UploadsModule } from '../uploads/uploads.module';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  ProductsRepository,
  VariantsRepository,
  ImagesRepository,
} from './repositories';
import { CategoriesRepository } from '../categories/repositories/categories.repository';

@Module({
  imports: [UploadsModule, PrismaModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsRepository,
    VariantsRepository,
    ImagesRepository,
    CategoriesRepository,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
