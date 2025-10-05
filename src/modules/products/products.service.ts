import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import shuffle from 'lodash/shuffle';
import { Product } from '../../entities/product.entity';
import { ProductListItem } from '../../common/interfaces/api.interfaces';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get 3 random products from coffee category
   */
  async getRandomCoffeeProducts(): Promise<Product[]> {
    const coffeeProducts = await this.productRepository.find({
      where: { category: 'coffee' },
    });

    if (coffeeProducts.length === 0) {
      return [];
    }

    // Shuffle array and take first 3 elements
    const shuffled = shuffle(coffeeProducts);
    return shuffled.slice(0, Math.min(3, shuffled.length));
  }

  /**
   * Get all products without sizes and additives fields
   */
  async getAllProducts(): Promise<ProductListItem[]> {
    const products = await this.productRepository.find({
      select: [
        'id',
        'name',
        'description',
        'price',
        'discountPrice',
        'category',
      ],
    });

    return products;
  }

  /**
   * Get full data of one product by ID
   */
  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Create product (for data seeding)
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  /**
   * Create multiple products (for seeding)
   */
  async createManyProducts(
    productsData: Partial<Product>[],
  ): Promise<Product[]> {
    const products = this.productRepository.create(productsData);
    return this.productRepository.save(products);
  }

  /**
   * Count total number of products
   */
  async count(): Promise<number> {
    return this.productRepository.count();
  }
}
