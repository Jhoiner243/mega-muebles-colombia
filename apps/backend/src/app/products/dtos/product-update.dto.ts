import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './product-create.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants', 'images'] as const),
) {}
