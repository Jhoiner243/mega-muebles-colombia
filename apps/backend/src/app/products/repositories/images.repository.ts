import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class ImagesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.productImage.findUnique({
      where: { id },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { isMain: 'desc' },
    });
  }

  async findMainByProduct(productId: string) {
    return this.prisma.productImage.findFirst({
      where: { productId, isMain: true },
    });
  }

  async create(data: Prisma.ProductImageCreateInput) {
    return this.prisma.productImage.create({ data });
  }

  async update(id: string, data: Prisma.ProductImageUpdateInput) {
    return this.prisma.productImage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.productImage.delete({ where: { id } });
  }

  async setMain(id: string, productId: string) {
    // Unset all other main images for this product
    await this.prisma.productImage.updateMany({
      where: { productId, isMain: true },
      data: { isMain: false },
    });

    // Set new main image
    return this.prisma.productImage.update({
      where: { id },
      data: { isMain: true },
    });
  }

  async countByProduct(productId: string) {
    return this.prisma.productImage.count({
      where: { productId },
    });
  }
}
