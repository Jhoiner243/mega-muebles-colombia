import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { PaymentsRepository } from '../orders/repositories';
import { CreatePaymentDto, ProcessPaymentDto } from './dtos';

@Injectable()
export class PaymentsService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private ordersService: OrdersService
  ) {}

  async create(orderId: string, dto: CreatePaymentDto) {
    // Verify order exists and belongs to user
    const order = await this.ordersService.findById(
      orderId,
      dto.userId,
      'USER'
    );

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('La orden ya fue procesada');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentsRepository.findByOrder(orderId);
    if (existingPayment) {
      throw new BadRequestException('Ya existe un pago para esta orden');
    }

    // Create payment record
    const payment = await this.paymentsRepository.create({
      order: { connect: { id: orderId } },
      provider: dto.provider,
      amount: order.total,
      status: 'PENDING',
    });

    return payment;
  }

  async processPayment(orderId: string, dto: ProcessPaymentDto) {
    const payment = await this.paymentsRepository.findByOrder(orderId);

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Simulate payment processing based on provider
    let status = 'FAILED';
    let transactionId = null;

    switch (payment.provider) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        // In production, integrate with Wompi or similar
        status = dto.success ? 'APPROVED' : 'FAILED';
        transactionId = dto.transactionId || `TXN-${Date.now()}`;
        break;

      case 'PSE':
        // PSE integration
        status = dto.success ? 'APPROVED' : 'FAILED';
        transactionId = dto.transactionId || `PSE-${Date.now()}`;
        break;

      case 'NEQUI':
      case 'DAVIPLATA':
        // Nequi/Daviplata integration
        status = dto.success ? 'APPROVED' : 'FAILED';
        transactionId =
          dto.transactionId || `${payment.provider}-${Date.now()}`;
        break;

      case 'CASH_ON_DELIVERY':
        status = 'PENDING';
        break;

      default:
        throw new BadRequestException('Método de pago no válido');
    }

    // Update payment
    const updatedPayment = await this.paymentsRepository.update(payment.id, {
      status,
      transactionId,
    });

    // Update order status if payment approved
    if (status === 'APPROVED') {
      await this.ordersService.updateStatus(orderId, {
        status: OrderStatus.PAID,
      });
    }

    return updatedPayment;
  }

  async getPaymentMethods() {
    return [
      {
        id: 'CREDIT_CARD',
        name: 'Tarjeta de Crédito',
        icon: 'credit-card',
        available: true,
      },
      {
        id: 'DEBIT_CARD',
        name: 'Tarjeta de Débito',
        icon: 'debit-card',
        available: true,
      },
      {
        id: 'PSE',
        name: 'PSE',
        icon: 'pse',
        available: true,
      },
      {
        id: 'NEQUI',
        name: 'Nequi',
        icon: 'nequi',
        available: true,
      },
      {
        id: 'DAVIPLATA',
        name: 'Daviplata',
        icon: 'daviplata',
        available: true,
      },
      {
        id: 'CASH_ON_DELIVERY',
        name: 'Contra Entrega',
        icon: 'cash',
        available: true,
      },
    ];
  }
}
