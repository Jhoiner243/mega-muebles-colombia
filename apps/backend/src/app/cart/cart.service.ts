import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { AddToCartDto, UpdateCartItemDto } from './dtos';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
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
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
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
        },
      });
    }

    return this.formatCart(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    // Verify variant exists and has stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('Variante de producto no encontrada');
    }

    if (!variant.product.isPublished) {
      throw new BadRequestException('Este producto no está disponible');
    }

    if (variant.stock < dto.quantity) {
      throw new BadRequestException(
        `Solo hay ${variant.stock} unidades disponibles`,
      );
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: dto.variantId,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > variant.stock) {
        throw new BadRequestException(
          `Solo hay ${variant.stock} unidades disponibles`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: { variant: true },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException(
        `Solo hay ${item.variant.stock} unidades disponibles`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { message: 'Carrito vaciado exitosamente' };
  }

  async getSummary(userId: string) {
    const cart = await this.getCart(userId);

    const subtotal = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    // Calculate tax (19% IVA in Colombia)
    const taxRate = 0.19;
    const tax = subtotal * taxRate;

    // Shipping cost - free above 200,000 COP
    const shippingCost = subtotal >= 200000 ? 0 : 15000;

    return {
      itemCount: cart.items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal,
      tax: Math.round(tax),
      shippingCost,
      total: Math.round(subtotal + tax + shippingCost),
      freeShippingThreshold: 200000,
      amountForFreeShipping: Math.max(0, 200000 - subtotal),
    };
  }

  private formatCart(cart: any) {
    return {
      id: cart.id,
      items: cart.items.map((item: any) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: Number(item.variant.price),
        comparePrice: item.variant.comparePrice
          ? Number(item.variant.comparePrice)
          : null,
        sku: item.variant.sku,
        attributes: item.variant.attributes,
        stock: item.variant.stock,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          image: item.variant.product.images[0]?.url || null,
        },
      })),
    };
  }
}
