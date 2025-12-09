import { IsEnum, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export enum PaymentProvider {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PSE = 'PSE',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export class CreatePaymentDto {
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsUUID()
  userId: string;
}

export class ProcessPaymentDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

