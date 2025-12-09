import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';

@Injectable()
export class WishlistRepository {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isMain: true }, take: 1 },
            variants: { orderBy: { price: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndProduct(userId: string, productId: string) {
    return this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  async exists(userId: string, productId: string): Promise<boolean> {
    const item = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    return !!item;
  }

  async add(userId: string, productId: string) {
    return this.prisma.wishlist.create({
      data: { userId, productId },
      include: {
        product: {
          include: {
            images: { where: { isMain: true }, take: 1 },
            variants: { orderBy: { price: 'asc' }, take: 1 },
          },
        },
      },
    });
  }

  async remove(userId: string, productId: string) {
    return this.prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clearByUser(userId: string) {
    return this.prisma.wishlist.deleteMany({ where: { userId } });
  }

  async countByUser(userId: string) {
    return this.prisma.wishlist.count({ where: { userId } });
  }

  async getProductIds(userId: string): Promise<string[]> {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    return items.map((item) => item.productId);
  }
}
