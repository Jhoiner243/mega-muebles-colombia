import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class PaymentsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { orderId },
    });
  }

  async findByTransaction(transactionId: string) {
    return this.prisma.payment.findFirst({
      where: { transactionId },
      include: { order: true },
    });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
      include: { order: true },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async updateByOrder(orderId: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({
      where: { orderId },
      data,
    });
  }

  async updateStatus(id: string, status: string, transactionId?: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { status, transactionId },
    });
  }
}
