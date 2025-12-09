import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { where: { isMain: true }, take: 1 },
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
  }

  async findOrCreate(userId: string) {
    let cart = await this.findByUser(userId);

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: cartInclude,
      });
    }

    return cart;
  }

  async getCartId(userId: string): Promise<string | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    return cart?.id || null;
  }

  async findItemByVariant(cartId: string, variantId: string) {
    return this.prisma.cartItem.findFirst({
      where: { cartId, variantId },
    });
  }

  async findItemById(id: string, cartId: string) {
    return this.prisma.cartItem.findFirst({
      where: { id, cartId },
      include: { variant: true },
    });
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    return this.prisma.cartItem.create({
      data: { cartId, variantId, quantity },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async incrementItemQuantity(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: { increment: quantity } },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async clearCartByUser(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  async getItemCount(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { select: { quantity: true } } },
    });

    return cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  }
}
