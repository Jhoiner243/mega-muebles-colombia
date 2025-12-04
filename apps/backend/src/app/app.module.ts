import { Module } from '@nestjs/common';
import { ProductsController } from './products/products.controller';
import { ProductsModule } from './products/products.module';
import { ProductsService } from './products/products.service';

@Module({
  imports: [ProductsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class AppModule {}
