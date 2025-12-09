import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findBySlugWithProducts(slug: string, productLimit = 12) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: {
          where: { isPublished: true },
          include: {
            images: { where: { isMain: true }, take: 1 },
            variants: { take: 1 },
          },
          take: productLimit,
        },
      },
    });
  }

  async findWithChildren(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });
  }

  async existsBySlug(slug: string, excludeId?: string) {
    const where: Prisma.CategoryWhereInput = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const category = await this.prisma.category.findFirst({
      where,
      select: { id: true },
    });
    return !!category;
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { parentId: id },
    });
    return count > 0;
  }

  async hasProducts(id: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { categoryId: id },
    });
    return count > 0;
  }

  async getChildIds(id: string): Promise<string[]> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });
    return category?.children.map((c) => c.id) || [];
  }
}
