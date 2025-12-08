import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

export interface ProductFilterParams {
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isPublished?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(params: ProductFilterParams) {
    const {
      search,
      categoryId,
      categoryIds,
      minPrice,
      maxPrice,
      inStock,
      isPublished = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip = 0,
      take = 12,
    } = params;

    const where: Prisma.ProductWhereInput = { isPublished };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categoryIds?.length) {
      where.categoryId = { in: categoryIds };
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        },
      };
    }

    // Stock filter
    if (inStock) {
      where.variants = {
        ...where.variants,
        some: {
          ...((where.variants as Prisma.ProductVariantListRelationFilter)?.some || {}),
          stock: { gt: 0 },
        },
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isMain: true }, take: 1 },
        variants: { orderBy: { price: 'asc' }, take: 1 },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });
  }

  async count(params: Omit<ProductFilterParams, 'skip' | 'take' | 'sortBy' | 'sortOrder'>) {
    const { search, categoryId, categoryIds, minPrice, maxPrice, inStock, isPublished = true } = params;

    const where: Prisma.ProductWhereInput = { isPublished };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categoryIds?.length) {
      where.categoryId = { in: categoryIds };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        },
      };
    }

    if (inStock) {
      where.variants = { some: { stock: { gt: 0 } } };
    }

    return this.prisma.product.count({ where });
  }

  async search(query: string, limit = 10) {
    if (!query || query.length < 2) return [];

    return this.prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: { where: { isMain: true }, select: { url: true }, take: 1 },
        variants: { select: { price: true }, orderBy: { price: 'asc' }, take: 1 },
      },
      take: limit,
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true, parent: true } },
        images: { orderBy: { isMain: 'desc' } },
        variants: true,
        reviews: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async existsBySlug(slug: string, excludeId?: string) {
    const where: Prisma.ProductWhereInput = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const product = await this.prisma.product.findFirst({
      where,
      select: { id: true },
    });
    return !!product;
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
