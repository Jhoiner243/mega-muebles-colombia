import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, OrderStatus, Prisma, Role } from '@prisma/client';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VariantsRepository } from '../products/repositories/variants.repository';
import { AddressesRepository } from '../users/repositories/addresses.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { OrdersRepository } from './repositories';

@Injectable()
export class OrdersService {
  constructor(
    private ordersRepository: OrdersRepository,
    private variantsRepository: VariantsRepository,
    private addressesRepository: AddressesRepository,
    private cartService: CartService,
    private notificationsService: NotificationsService
  ) {}

  async findAll(userId: string, role: string) {
    const where = role === Role.ADMIN ? {} : { userId };

    return this.ordersRepository.findAll(where);
  }

  async findById(id: string, userId: string, role: string) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Only owner or admin can view
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    // Get cart with items
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Verify shipping address belongs to user
    const address = await this.addressesRepository.findByIdAndUser(
      dto.shippingAddressId,
      userId
    );

    if (!address) {
      throw new NotFoundException('Dirección de envío no encontrada');
    }

    // Verify stock for all items
    for (const item of cart.items) {
      const variant = await this.variantsRepository.findById(item.variantId);

      if (!variant || variant.stock < item.quantity) {
        throw new BadRequestException(
          `El producto ${item.product.name} no tiene suficiente stock`
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (acc: number, item: { price: number | string; quantity: number }) =>
        acc + Number(item.price) * item.quantity,
      0
    );
    const taxRate = 0.19;
    const tax = subtotal * taxRate;
    const shippingCost = subtotal >= 200000 ? 0 : 15000;
    const total = subtotal + tax + shippingCost;

    // Create order in transaction
    const order = await this.ordersRepository.createWithTransaction(
      async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            subtotal,
            tax: Math.round(tax),
            shippingCost,
            total: Math.round(total),
            shippingAddressId: dto.shippingAddressId,
            shippingAddressSnapshot: {
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              country: address.country,
            },
            items: {
              create: cart.items.map(
                (item: {
                  variantId: string;
                  quantity: number;
                  price: number | string;
                  product: { name: string };
                }) => ({
                  variantId: item.variantId,
                  quantity: item.quantity,
                  price: item.price,
                  productName: item.product.name,
                })
              ),
            },
          },
          include: {
            items: true,
            shippingAddress: true,
          },
        });

        // Update stock for each item
        for (const item of cart.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }

        // Clear cart
        const userCart = await tx.cart.findUnique({ where: { userId } });
        if (userCart) {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }

        return newOrder;
      }
    );

    // Send order confirmation notification
    const orderWithUser = await this.ordersRepository.findByIdWithUser(
      order.id
    );

    if (orderWithUser && orderWithUser.user) {
      await this.notificationsService.sendOrderConfirmation(
        orderWithUser as typeof orderWithUser & {
          user: { email: string; fullName: string };
        }
      );
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    if (!validTransitions[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.status} a ${dto.status}`
      );
    }

    const oldStatus = order.status;

    // If cancelling, restore stock
    if (dto.status === OrderStatus.CANCELLED) {
      await this.restoreStock(id);
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: dto.status,
      ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      ...(dto.carrier && { carrier: dto.carrier }),
      ...(dto.status === OrderStatus.SHIPPED && {
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      }),
    };

    const updatedOrderResult = await this.ordersRepository.update(
      id,
      updateData
    );
    const updatedOrder = await this.ordersRepository.findByIdWithFullDetails(
      updatedOrderResult.id
    );

    // Send notifications
    if (oldStatus !== dto.status && updatedOrder && updatedOrder.user) {
      const orderForNotification = updatedOrder as typeof updatedOrder & {
        user: { email: string; fullName: string };
      };
      await this.notificationsService.sendOrderStatusUpdate(
        orderForNotification,
        oldStatus,
        dto.status
      );

      if (dto.status === OrderStatus.SHIPPED) {
        const shippingOrder = {
          ...orderForNotification,
          user: orderForNotification.user
            ? {
                ...orderForNotification.user,
                phone: orderForNotification.user.phone || undefined,
              }
            : undefined,
          trackingNumber: orderForNotification.trackingNumber || undefined,
        } as Order & {
          user?: { email: string; fullName: string; phone?: string };
          trackingNumber?: string;
        };
        await this.notificationsService.sendShippingNotification(shippingOrder);
      }
    }

    return updatedOrder || updatedOrderResult;
  }

  async cancel(id: string, userId: string) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar órdenes pendientes'
      );
    }

    await this.restoreStock(id);

    return this.ordersRepository.updateStatus(id, OrderStatus.CANCELLED);
  }

  private async restoreStock(orderId: string) {
    const orderItems = await this.ordersRepository.getOrderItems(orderId);

    for (const item of orderItems) {
      await this.variantsRepository.incrementStock(
        item.variantId,
        item.quantity
      );
    }
  }
}
