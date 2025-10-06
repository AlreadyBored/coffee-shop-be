import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { ProductsService } from '../../modules/products/products.service';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock fs module
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

// Mock path module
jest.mock('node:path', () => ({
  join: jest.fn(),
}));

// Mock safeJsonParse utility
jest.mock('../utils/json.utils', () => ({
  safeJsonParse: jest.fn(),
}));

import { safeJsonParse } from '../utils/json.utils';

describe('SeedService', () => {
  let service: SeedService;

  const mockProductsService = {
    count: jest.fn(),
    createManyProducts: jest.fn(),
  };

  const mockJsonProducts = [
    {
      name: 'Test Coffee 1',
      description: 'Test Description 1',
      price: '5.99',
      discountPrice: null,
      category: 'coffee',
      sizes: [{ size: 'S', price: '5.99' }],
      additives: [{ name: 'Sugar', price: '0.50' }],
    },
    {
      name: 'Test Coffee 2',
      description: 'Test Description 2',
      price: '6.99',
      discountPrice: '5.99',
      category: 'coffee',
      sizes: [{ size: 'M', price: '6.99' }],
      additives: [{ name: 'Milk', price: '0.75' }],
    },
  ];

  // Mock logger methods
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);

    // Replace the logger instance with our mock
    (service as any).logger = mockLogger;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedProducts', () => {
    beforeEach(() => {
      (path.join as jest.Mock).mockReturnValue('/mock/path/products.json');
    });

    it('should skip seeding when products already exist', async () => {
      mockProductsService.count.mockResolvedValue(5);

      await service.seedProducts();

      expect(mockProductsService.count).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Products already exist in database, skipping seed',
      );
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('should log error when products file does not exist', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await service.seedProducts();

      expect(fs.existsSync).toHaveBeenCalledWith('/mock/path/products.json');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Products file not found at path: /mock/path/products.json',
      );
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    it('should log error when JSON parsing fails', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('invalid json');
      (safeJsonParse as jest.Mock).mockReturnValue(null);

      await service.seedProducts();

      expect(fs.promises.readFile).toHaveBeenCalledWith(
        '/mock/path/products.json',
        'utf8',
      );
      expect(safeJsonParse).toHaveBeenCalledWith('invalid json');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Products data is invalid or failed to parse',
      );
      expect(mockProductsService.createManyProducts).not.toHaveBeenCalled();
    });

    it('should log error when parsed data is not an array', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('{}');
      (safeJsonParse as jest.Mock).mockReturnValue({});

      await service.seedProducts();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Products data is invalid or failed to parse',
      );
      expect(mockProductsService.createManyProducts).not.toHaveBeenCalled();
    });

    it('should successfully seed products when valid data is provided', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockJsonProducts),
      );
      (safeJsonParse as jest.Mock).mockReturnValue(mockJsonProducts);
      mockProductsService.createManyProducts.mockResolvedValue([]);

      await service.seedProducts();

      expect(fs.promises.readFile).toHaveBeenCalledWith(
        '/mock/path/products.json',
        'utf8',
      );
      expect(safeJsonParse).toHaveBeenCalledWith(
        JSON.stringify(mockJsonProducts),
      );

      const expectedTransformedProducts = mockJsonProducts.map((product) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice || null,
        category: product.category,
        sizes: product.sizes,
        additives: product.additives,
      }));

      expect(mockProductsService.createManyProducts).toHaveBeenCalledWith(
        expectedTransformedProducts,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Successfully seeded 2 products',
      );
    });

    it('should handle discountPrice transformation correctly', async () => {
      const productsWithVariousDiscounts = [
        { ...mockJsonProducts[0], discountPrice: '4.99' },
        { ...mockJsonProducts[1], discountPrice: null },
        { ...mockJsonProducts[0], discountPrice: undefined },
      ];

      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(productsWithVariousDiscounts),
      );
      (safeJsonParse as jest.Mock).mockReturnValue(
        productsWithVariousDiscounts,
      );
      mockProductsService.createManyProducts.mockResolvedValue([]);

      await service.seedProducts();

      const expectedTransformedProducts = [
        expect.objectContaining({ discountPrice: '4.99' }),
        expect.objectContaining({ discountPrice: null }),
        expect.objectContaining({ discountPrice: null }),
      ];

      expect(mockProductsService.createManyProducts).toHaveBeenCalledWith(
        expectedTransformedProducts,
      );
    });

    it('should throw error when createManyProducts fails', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockJsonProducts),
      );
      (safeJsonParse as jest.Mock).mockReturnValue(mockJsonProducts);

      const error = new Error('Database error');
      mockProductsService.createManyProducts.mockRejectedValue(error);

      await expect(service.seedProducts()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error seeding products:',
        error,
      );
    });

    it('should throw error when file reading fails', async () => {
      mockProductsService.count.mockResolvedValue(0);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const error = new Error('File read error');
      (fs.promises.readFile as jest.Mock).mockRejectedValue(error);

      await expect(service.seedProducts()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error seeding products:',
        error,
      );
    });
  });

  describe('seedAll', () => {
    it('should call seedProducts and log completion', async () => {
      const seedProductsSpy = jest
        .spyOn(service, 'seedProducts')
        .mockResolvedValue();

      await service.seedAll();

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Starting database seeding...',
      );
      expect(seedProductsSpy).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith('Database seeding completed');
    });

    it('should propagate errors from seedProducts', async () => {
      const error = new Error('Seeding failed');
      jest.spyOn(service, 'seedProducts').mockRejectedValue(error);

      await expect(service.seedAll()).rejects.toThrow(error);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Starting database seeding...',
      );
    });
  });
});
