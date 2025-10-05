import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import type { ProductListItem } from '../../common/interfaces/api.interfaces';
import {
  ProductsListResponseDto,
  ProductListItemsResponseDto,
  ProductResponseDto,
  ErrorResponseDto,
} from '../../common/dto/response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products/favorites
   * Get 3 random products from coffee category for main page
   */
  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite coffee products for main page' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Favorite products retrieved successfully',
    type: ProductsListResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async getFavoriteProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.productsService.getRandomCoffeeProducts();
      return {
        data: products,
      };
    } catch (error) {
      console.error('Error fetching favorite products:', error);
      throw new HttpException(
        {
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
  @ApiOperation({ summary: 'Get all products for menu page' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductListItemsResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async getAllProducts(): Promise<ApiResponse<ProductListItem[]>> {
    try {
      const products = await this.productsService.getAllProducts();
      return {
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        {
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
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.getProductById(id);
      return {
        data: product,
      };
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException(
          {
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          error: 'Failed to fetch product',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
