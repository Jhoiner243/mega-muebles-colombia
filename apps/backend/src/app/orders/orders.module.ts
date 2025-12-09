import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VariantsRepository } from '../products/repositories/variants.repository';
import { AddressesRepository } from '../users/repositories/addresses.repository';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository, PaymentsRepository } from './repositories';

@Module({
  imports: [CartModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    PaymentsRepository,
    VariantsRepository,
    AddressesRepository,
  ],
  exports: [OrdersService, OrdersRepository, PaymentsRepository],
})
export class OrdersModule {}

