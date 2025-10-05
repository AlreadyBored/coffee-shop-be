import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';
import {
  ApiResponse,
  ProductListItem,
} from '../../common/interfaces/api.interfaces';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products/favorites
   * Get 3 random products from coffee category for main page
   */
  @Get('favorites')
  async getFavoriteProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.productsService.getRandomCoffeeProducts();
      return {
        success: true,
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch favorite products',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /products
   * Get all products without sizes and additives fields for menu page
   */
  @Get()
  async getAllProducts(): Promise<ApiResponse<ProductListItem[]>> {
    try {
      const products = await this.productsService.getAllProducts();
      return {
        success: true,
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch products',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /products/:id
   * Get full data of one product by ID for modal window
   */
  @Get(':id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.getProductById(id);
      return {
        success: true,
        data: product,
      };
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch product',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
