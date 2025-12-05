import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Clean database for testing purposes
   * WARNING: This will delete all data
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in order respecting foreign key constraints
    await this.wishlist.deleteMany();
    await this.review.deleteMany();
    await this.cartItem.deleteMany();
    await this.cart.deleteMany();
    await this.orderItem.deleteMany();
    await this.payment.deleteMany();
    await this.order.deleteMany();
    await this.productImage.deleteMany();
    await this.productVariant.deleteMany();
    await this.product.deleteMany();
    await this.category.deleteMany();
    await this.address.deleteMany();
    await this.user.deleteMany();
  }
}
