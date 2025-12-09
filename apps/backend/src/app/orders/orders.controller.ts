import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.ordersService.findAll(user.id, user.role);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string }
  ) {
    return this.ordersService.findById(id, user.id, user.role);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: string }) {
    return this.ordersService.create(user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.ordersService.cancel(id, user.id);
  }
}
