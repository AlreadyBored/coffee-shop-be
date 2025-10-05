import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../../modules/products/products.service';
import { Product } from '../../entities/product.entity';
import {
  JsonProductsData,
  JsonProduct,
} from '../interfaces/json-data.interfaces';
import { safeJsonParse } from '../utils/json.utils';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly productsService: ProductsService) {}

  async seedProducts(): Promise<void> {
    try {
      const existingProductsCount = await this.productsService.count();
      if (existingProductsCount > 0) {
        this.logger.log('Products already exist in database, skipping seed');
        return;
      }

      const productsFilePath = path.join(
        __dirname,
        '../../../data/products.json',
      );

      if (!fs.existsSync(productsFilePath)) {
        this.logger.error(
          `Products file not found at path: ${productsFilePath}`,
        );
        return;
      }

      const productsData = await fs.promises.readFile(productsFilePath, 'utf8');
      const products = safeJsonParse<JsonProductsData>(productsData);

      if (!products || !Array.isArray(products)) {
        this.logger.error('Products data is invalid or failed to parse');
        return;
      }

      const transformedProducts: Partial<Product>[] = products.map(
        (product: JsonProduct) => ({
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice || null,
          category: product.category,
          sizes: product.sizes,
          additives: product.additives,
        }),
      );

      await this.productsService.createManyProducts(transformedProducts);

      this.logger.log(
        `Successfully seeded ${transformedProducts.length} products`,
      );
    } catch (error) {
      this.logger.error('Error seeding products:', error);
      throw error;
    }
  }

  async seedAll(): Promise<void> {
    this.logger.log('Starting database seeding...');

    await this.seedProducts();

    this.logger.log('Database seeding completed');
  }
}
