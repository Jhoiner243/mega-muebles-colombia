import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class VariantsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.productVariant.findUnique({
      where: { sku },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { price: 'asc' },
    });
  }

  async existsBySku(sku: string, excludeId?: string) {
    const where: Prisma.ProductVariantWhereInput = { sku };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const variant = await this.prisma.productVariant.findFirst({
      where,
      select: { id: true },
    });
    return !!variant;
  }

  async create(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  async update(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.productVariant.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { stock: quantity },
    });
  }

  async incrementStock(id: string, quantity: number) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { stock: { increment: quantity } },
    });
  }

  async decrementStock(id: string, quantity: number) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
  }

  async checkStock(id: string, requiredQuantity: number): Promise<boolean> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      select: { stock: true },
    });
    return (variant?.stock || 0) >= requiredQuantity;
  }
}
