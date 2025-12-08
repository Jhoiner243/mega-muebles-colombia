import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriesRepository } from '../categories/repositories/categories.repository';
import {
  CreateProductDto,
  CreateVariantDto,
  ProductFilterDto,
  UpdateProductDto,
} from './dtos';
import {
  ImagesRepository,
  ProductsRepository,
  VariantsRepository,
} from './repositories';

@Injectable()
export class ProductsService {
  constructor(
    private productsRepository: ProductsRepository,
    private variantsRepository: VariantsRepository,
    private imagesRepository: ImagesRepository,
    private categoriesRepository: CategoriesRepository
  ) {}

  async findAll(filters: ProductFilterDto) {
    const {
      search,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = filters;

    // Handle category slug to get category IDs
    let categoryIds: string[] | undefined;
    if (categorySlug) {
      const category = await this.categoriesRepository.findBySlug(categorySlug);
      if (category) {
        const childIds = await this.categoriesRepository.getChildIds(
          category.id
        );
        categoryIds = [category.id, ...childIds];
      }
    }

    // Build filter params for repository
    const filterParams = {
      search,
      categoryId: categoryId || undefined,
      categoryIds,
      minPrice,
      maxPrice,
      inStock,
      isPublished: true,
      sortBy: sortBy as 'name' | 'price' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
      skip: (page - 1) * limit,
      take: limit,
    };

    // Get products and total count
    const [products, total] = await Promise.all([
      this.productsRepository.findAll(filterParams),
      this.productsRepository.count({
        search,
        categoryId: categoryId || undefined,
        categoryIds,
        minPrice,
        maxPrice,
        inStock,
        isPublished: true,
      }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(query: string) {
    return this.productsRepository.search(query, 10);
  }

  async findBySlug(slug: string) {
    const product = await this.productsRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Calculate average rating
    const avgRating =
      product.reviews && product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
          product.reviews.length
        : 0;

    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews?.length || 0,
    };
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    // Check if slug exists
    const slugExists = await this.productsRepository.existsBySlug(dto.slug);
    if (slugExists) {
      throw new ConflictException('Ya existe un producto con ese slug');
    }

    // Verify category exists
    const category = await this.categoriesRepository.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Prepare product data
    const productData: Prisma.ProductCreateInput = {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
      category: { connect: { id: dto.categoryId } },
      manualUrl: dto.manualUrl,
      isPublished: dto.isPublished ?? true,
      variants: dto.variants
        ? {
            create: dto.variants.map((v) => ({
              sku: v.sku,
              price: v.price,
              comparePrice: v.comparePrice,
              stock: v.stock ?? 0,
              attributes: v.attributes,
            })),
          }
        : undefined,
      images: dto.images
        ? {
            create: dto.images.map((url, index) => ({
              url,
              isMain: index === 0,
            })),
          }
        : undefined,
    };

    return this.productsRepository.create(productData);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    // Check slug uniqueness
    if (dto.slug) {
      const slugExists = await this.productsRepository.existsBySlug(
        dto.slug,
        id
      );
      if (slugExists) {
        throw new ConflictException('Ya existe un producto con ese slug');
      }
    }

    // Verify category if changing
    if (dto.categoryId) {
      const category = await this.categoriesRepository.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    // Prepare update data
    const updateData: Prisma.ProductUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.description && { description: dto.description }),
      ...(dto.metaTitle && { metaTitle: dto.metaTitle }),
      ...(dto.metaDesc && { metaDesc: dto.metaDesc }),
      ...(dto.manualUrl !== undefined && { manualUrl: dto.manualUrl }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      ...(dto.categoryId && {
        category: { connect: { id: dto.categoryId } },
      }),
    };

    return this.productsRepository.update(id, updateData);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.productsRepository.delete(id);
  }

  // Variant operations
  async addVariant(productId: string, dto: CreateVariantDto) {
    await this.findById(productId);

    // Check SKU uniqueness
    const skuExists = await this.variantsRepository.existsBySku(dto.sku);
    if (skuExists) {
      throw new ConflictException('Ya existe una variante con ese SKU');
    }

    const variantData: Prisma.ProductVariantCreateInput = {
      product: { connect: { id: productId } },
      sku: dto.sku,
      price: dto.price,
      comparePrice: dto.comparePrice,
      stock: dto.stock ?? 0,
      attributes: dto.attributes,
    };

    return this.variantsRepository.create(variantData);
  }

  async updateVariant(variantId: string, dto: Partial<CreateVariantDto>) {
    const variant = await this.variantsRepository.findById(variantId);

    if (!variant) {
      throw new NotFoundException('Variante no encontrada');
    }

    const updateData: Prisma.ProductVariantUpdateInput = {
      ...(dto.price && { price: dto.price }),
      ...(dto.comparePrice !== undefined && { comparePrice: dto.comparePrice }),
      ...(dto.stock !== undefined && { stock: dto.stock }),
      ...(dto.attributes !== undefined && { attributes: dto.attributes }),
    };

    return this.variantsRepository.update(variantId, updateData);
  }

  async removeVariant(variantId: string) {
    const variant = await this.variantsRepository.findById(variantId);

    if (!variant) {
      throw new NotFoundException('Variante no encontrada');
    }

    return this.variantsRepository.delete(variantId);
  }

  // Image operations
  async addImage(
    productId: string,
    url: string,
    isMain = false,
    publicId?: string
  ) {
    await this.findById(productId);

    // If setting as main, unset other main images
    if (isMain) {
      const mainImages = await this.imagesRepository.findByProduct(productId);
      const currentMain = mainImages.find((img) => img.isMain);
      if (currentMain) {
        await this.imagesRepository.update(currentMain.id, { isMain: false });
      }
    }

    const imageData: Prisma.ProductImageCreateInput = {
      product: { connect: { id: productId } },
      url,
      ...(publicId && { publicId }),
      isMain,
    };

    return this.imagesRepository.create(imageData);
  }

  async setMainImage(imageId: string) {
    const image = await this.imagesRepository.findById(imageId);

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return this.imagesRepository.setMain(imageId, image.productId);
  }

  async removeImage(imageId: string) {
    const image = await this.imagesRepository.findById(imageId);

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return this.imagesRepository.delete(imageId);
  }
}
