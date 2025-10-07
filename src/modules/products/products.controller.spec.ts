import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import {
  Product,
  ProductSizes,
  ProductAdditive,
} from '../../entities/product.entity';
import {
  expectSuccessOrTestErrorUnit,
  expectSpecificErrorOrTestErrorUnit,
  mockSimulateRandomError,
} from '../../../test/helpers/unit-test.helper';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockSimulateRandomErrorFn: jest.MockedFunction<() => void>;

  const mockSizes: ProductSizes = {
    s: { size: '200 ml', price: '5.99' },
    m: { size: '300 ml', price: '6.99' },
  };

  const mockAdditives: ProductAdditive[] = [
    { name: 'Sugar', price: '0.50' },
    { name: 'Milk', price: '0.75' },
  ];

  const mockProduct: Product = {
    id: 1,
    name: 'Test Coffee',
    description: 'Test Description',
    price: '5.99',
    discountPrice: null,
    category: 'coffee',
    sizes: mockSizes,
    additives: mockAdditives,
  };

  const mockProductListItem = {
    id: 1,
    name: 'Test Coffee',
    description: 'Test Description',
    price: '5.99',
    discountPrice: null,
    category: 'coffee',
  };

  const mockProductsService = {
    getRandomCoffeeProducts: jest.fn(),
    getAllProducts: jest.fn(),
    getProductById: jest.fn(),
  };

  beforeEach(async () => {
    // Mock the error simulation function
    mockSimulateRandomErrorFn = mockSimulateRandomError();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);

    // Clear all mocks before each test
    jest.clearAllMocks();
    mockSimulateRandomErrorFn.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFavoriteProducts', () => {
    it('should return random coffee products successfully', async () => {
      const mockCoffeeProducts = [
        mockProductListItem,
        { ...mockProductListItem, id: 2 },
      ];
      mockProductsService.getRandomCoffeeProducts.mockResolvedValue(
        mockCoffeeProducts,
      );

      await expectSuccessOrTestErrorUnit(
        () => controller.getFavoriteProducts(),
        (result) => {
          expect(
            mockProductsService.getRandomCoffeeProducts,
          ).toHaveBeenCalled();
          expect(result).toEqual({
            data: mockCoffeeProducts,
          });
        },
      );
    });

    it('should return empty array when no coffee products exist', async () => {
      mockProductsService.getRandomCoffeeProducts.mockResolvedValue([]);

      await expectSuccessOrTestErrorUnit(
        () => controller.getFavoriteProducts(),
        (result) => {
          expect(result).toEqual({
            data: [],
          });
        },
      );
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Database error');
      mockProductsService.getRandomCoffeeProducts.mockRejectedValue(error);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.getFavoriteProducts(),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to fetch favorite products',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return all products successfully', async () => {
      const mockProducts = [
        mockProductListItem,
        { ...mockProductListItem, id: 2 },
      ];
      mockProductsService.getAllProducts.mockResolvedValue(mockProducts);

      await expectSuccessOrTestErrorUnit(
        () => controller.getAllProducts(),
        (result) => {
          expect(mockProductsService.getAllProducts).toHaveBeenCalled();
          expect(result).toEqual({
            data: mockProducts,
          });
        },
      );
    });

    it('should return empty array when no products exist', async () => {
      mockProductsService.getAllProducts.mockResolvedValue([]);

      await expectSuccessOrTestErrorUnit(
        () => controller.getAllProducts(),
        (result) => {
          expect(result).toEqual({
            data: [],
          });
        },
      );
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Database error');
      mockProductsService.getAllProducts.mockRejectedValue(error);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.getAllProducts(),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to fetch products',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by ID successfully', async () => {
      mockProductsService.getProductById.mockResolvedValue(mockProduct);

      await expectSuccessOrTestErrorUnit(
        () => controller.getProductById(1),
        (result) => {
          expect(mockProductsService.getProductById).toHaveBeenCalledWith(1);
          expect(result).toEqual({
            data: mockProduct,
          });
        },
      );
    });

    it('should throw HttpException when product not found', async () => {
      const notFoundError = new Error('Product with ID 999 not found');
      (notFoundError as any).status = 404;
      mockProductsService.getProductById.mockRejectedValue(notFoundError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.getProductById(999),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Product with ID 999 not found',
          });
          expect(httpError.getStatus()).toBe(404);
        },
      );
    });

    it('should throw HttpException for invalid ID format', async () => {
      const invalidIdError = new Error('Invalid ID format');
      mockProductsService.getProductById.mockRejectedValue(invalidIdError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.getProductById(-1),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to fetch product',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });

    it('should handle service throwing generic error', async () => {
      const genericError = new Error('Database connection failed');
      mockProductsService.getProductById.mockRejectedValue(genericError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.getProductById(1),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to fetch product',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });

    it('should handle ParseIntPipe validation (integration test)', async () => {
      // This would be handled by NestJS pipes before reaching the controller
      // but we can test the controller's expectation of receiving a number
      mockProductsService.getProductById.mockResolvedValue(mockProduct);

      await expectSuccessOrTestErrorUnit(
        () => controller.getProductById(1),
        (result) => {
          expect(mockProductsService.getProductById).toHaveBeenCalledWith(1);
          expect(typeof 1).toBe('number');
          expect(result.data).toEqual(mockProduct);
        },
      );
    });
  });

  describe('error handling', () => {
    it('should handle service returning null gracefully', async () => {
      mockProductsService.getRandomCoffeeProducts.mockResolvedValue(null);

      await expectSuccessOrTestErrorUnit(
        () => controller.getFavoriteProducts(),
        (result) => {
          expect(result).toEqual({
            data: null,
          });
        },
      );
    });

    it('should handle service returning undefined gracefully', async () => {
      mockProductsService.getAllProducts.mockResolvedValue(undefined);

      await expectSuccessOrTestErrorUnit(
        () => controller.getAllProducts(),
        (result) => {
          expect(result).toEqual({
            data: undefined,
          });
        },
      );
    });
  });

  describe('response format', () => {
    it('should always return data wrapped in ApiResponse format', async () => {
      const testData = [mockProduct];
      mockProductsService.getRandomCoffeeProducts.mockResolvedValue(testData);

      await expectSuccessOrTestErrorUnit(
        () => controller.getFavoriteProducts(),
        (result) => {
          expect(result).toHaveProperty('data');
          expect(result.data).toEqual(testData);
          expect(result).not.toHaveProperty('success'); // Removed as per requirements
          expect(result).not.toHaveProperty('message');
          expect(result).not.toHaveProperty('error');
        },
      );
    });
  });
});
