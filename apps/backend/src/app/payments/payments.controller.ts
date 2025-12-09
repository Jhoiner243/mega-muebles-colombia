import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessPaymentDto } from './dtos';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Post('orders/:orderId')
  create(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentsService.create(orderId, {
      ...dto,
      userId: user.id,
    });
  }

  @Post('orders/:orderId/process')
  processPayment(
    @Param('orderId') orderId: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentsService.processPayment(orderId, dto);
  }
}

