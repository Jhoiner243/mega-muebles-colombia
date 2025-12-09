import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AddressesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.address.findUnique({
      where: { id },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.prisma.address.findFirst({
      where: { id, userId },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultByUser(userId: string) {
    return this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });
  }

  async create(data: Prisma.AddressCreateInput) {
    return this.prisma.address.create({ data });
  }

  async update(id: string, data: Prisma.AddressUpdateInput) {
    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.address.delete({
      where: { id },
    });
  }

  async setDefault(id: string, userId: string) {
    // Unset all other defaults
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async countByUser(userId: string) {
    return this.prisma.address.count({
      where: { userId },
    });
  }
}
