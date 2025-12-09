import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class ReviewsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: { user: { select: { fullName: true } } },
    });
  }

  async findByProduct(productId: string, limit = 10) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndProduct(userId: string, productId: string) {
    return this.prisma.review.findFirst({
      where: { userId, productId },
    });
  }

  async create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({
      data,
      include: { user: { select: { fullName: true } } },
    });
  }

  async update(id: string, data: Prisma.ReviewUpdateInput) {
    return this.prisma.review.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });
    return result._avg.rating || 0;
  }

  async countByProduct(productId: string) {
    return this.prisma.review.count({ where: { productId } });
  }

  async getProductStats(productId: string) {
    const [count, avg] = await Promise.all([
      this.countByProduct(productId),
      this.getAverageRating(productId),
    ]);
    return { count, avgRating: Math.round(avg * 10) / 10 };
  }
}
