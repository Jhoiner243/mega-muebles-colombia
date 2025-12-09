import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

const orderInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true } },
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
  shippingAddress: true,
  payment: true,
};

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(where?: Prisma.OrderWhereInput) {
    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async findByOrderNumber(orderNumber: number) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
  }

  async findByStatus(status: OrderStatus) {
    return this.prisma.order.findMany({
      where: { status },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: orderInclude,
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: orderInclude,
    });
  }

  async updateStatus(id: string, status: OrderStatus, additionalData?: Partial<Prisma.OrderUpdateInput>) {
    return this.prisma.order.update({
      where: { id },
      data: { status, ...additionalData },
      include: orderInclude,
    });
  }

  async getOrderItems(orderId: string) {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      include: { variant: true },
    });
  }

  async createOrderWithItems(
    orderData: Omit<Prisma.OrderCreateInput, 'items'>,
    items: Array<{ variantId: string; quantity: number; price: number; productName: string }>,
  ) {
    return this.prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: orderInclude,
    });
  }

  async countByUser(userId: string) {
    return this.prisma.order.count({ where: { userId } });
  }

  async countByStatus(status: OrderStatus) {
    return this.prisma.order.count({ where: { status } });
  }

  async getTotalSales(startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {
      status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const result = await this.prisma.order.aggregate({
      where,
      _sum: { total: true },
    });

    return Number(result._sum.total || 0);
  }

  async createWithTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async findByIdWithUser(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, fullName: true } },
      },
    });
  }

  async findByIdWithFullDetails(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
        user: { select: { email: true, fullName: true, phone: true } },
      },
    });
  }
}
