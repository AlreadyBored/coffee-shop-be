import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

// Mock the entity file to avoid Swagger decorator issues
jest.mock('../../entities/product.entity', () => ({
  Product: class Product {
    id: number;
    name: string;
    description: string;
    price: string;
    discountPrice: string | null;
    category: string;
    sizes: ProductSizes;
    additives: ProductAdditive[];
  },
  ProductSizes: {},
  ProductAdditive: {},
}));

import { ProductsService } from './products.service';

// Mock entity types to avoid Swagger decorator issues
interface ProductSizes {
  s?: { size: string; price: string; discountPrice?: string };
  m?: { size: string; price: string; discountPrice?: string };
  l?: { size: string; price: string; discountPrice?: string };
  xl?: { size: string; price: string; discountPrice?: string };
  xxl?: { size: string; price: string; discountPrice?: string };
}

interface ProductAdditive {
  name: string;
  price: string;
  discountPrice?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  discountPrice: string | null;
  category: string;
  sizes: ProductSizes;
  additives: ProductAdditive[];
}

// Mock lodash shuffle function
jest.mock('lodash', () => ({
  shuffle: jest.fn((array) => [...array].reverse()), // Simple mock that reverses array
}));

// Get the mocked Product class from the jest mock
const { Product } = jest.requireMock('../../entities/product.entity');

describe('ProductsService', () => {
  let service: ProductsService;

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

  const mockCoffeeProducts: Product[] = [
    { ...mockProduct, id: 1, name: 'Coffee 1' },
    { ...mockProduct, id: 2, name: 'Coffee 2' },
    { ...mockProduct, id: 3, name: 'Coffee 3' },
    { ...mockProduct, id: 4, name: 'Coffee 4' },
  ];

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRandomCoffeeProducts', () => {
    it('should return 3 random coffee products without sizes and additives when more than 3 exist', async () => {
      const mockProductsWithoutSizesAndAdditives = mockCoffeeProducts.map(
        (product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          category: product.category,
        }),
      );
      mockRepository.find.mockResolvedValue(
        mockProductsWithoutSizesAndAdditives,
      );

      const result = await service.getRandomCoffeeProducts();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: 'coffee' },
        select: [
          'id',
          'name',
          'description',
          'price',
          'discountPrice',
          'category',
        ],
      });
      expect(result).toHaveLength(3);
      expect(result.every((product) => product.category === 'coffee')).toBe(
        true,
      );
      // Verify sizes and additives are not included
      expect(result.every((product) => !('sizes' in product))).toBe(true);
      expect(result.every((product) => !('additives' in product))).toBe(true);
    });

    it('should return all coffee products without sizes and additives when less than 3 exist', async () => {
      const twoProductsWithoutSizesAndAdditives = mockCoffeeProducts
        .slice(0, 2)
        .map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          category: product.category,
        }));
      mockRepository.find.mockResolvedValue(
        twoProductsWithoutSizesAndAdditives,
      );

      const result = await service.getRandomCoffeeProducts();

      expect(result).toHaveLength(2);
      expect(result).toEqual(twoProductsWithoutSizesAndAdditives.reverse()); // Due to our mock shuffle
      // Verify sizes and additives are not included
      expect(result.every((product) => !('sizes' in product))).toBe(true);
      expect(result.every((product) => !('additives' in product))).toBe(true);
    });

    it('should return empty array when no coffee products exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getRandomCoffeeProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products with selected fields only', async () => {
      const mockProductsWithSelectedFields = mockCoffeeProducts.map(
        (product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          category: product.category,
        }),
      );

      mockRepository.find.mockResolvedValue(mockProductsWithSelectedFields);

      const result = await service.getAllProducts();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: [
          'id',
          'name',
          'description',
          'price',
          'discountPrice',
          'category',
        ],
      });
      expect(result).toEqual(mockProductsWithSelectedFields);
    });

    it('should return empty array when no products exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getProductById(999)).rejects.toThrow(
        new NotFoundException('Product with ID 999 not found'),
      );
    });
  });

  describe('createProduct', () => {
    it('should create and save a new product', async () => {
      const productData = {
        name: 'New Coffee',
        description: 'New Description',
        price: '6.99',
        category: 'coffee',
      };

      mockRepository.create.mockReturnValue({ ...mockProduct, ...productData });
      mockRepository.save.mockResolvedValue({ ...mockProduct, ...productData });

      const result = await service.createProduct(productData);

      expect(mockRepository.create).toHaveBeenCalledWith(productData);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockProduct,
        ...productData,
      });
      expect(result).toEqual({ ...mockProduct, ...productData });
    });
  });

  describe('createManyProducts', () => {
    it('should create and save multiple products', async () => {
      const productsData = [
        { name: 'Coffee 1', price: '5.99', category: 'coffee' },
        { name: 'Coffee 2', price: '6.99', category: 'coffee' },
      ];

      const createdProducts = productsData.map((data, index) => ({
        ...mockProduct,
        id: index + 1,
        ...data,
      }));

      mockRepository.create.mockReturnValue(createdProducts);
      mockRepository.save.mockResolvedValue(createdProducts);

      const result = await service.createManyProducts(productsData);

      expect(mockRepository.create).toHaveBeenCalledWith(productsData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdProducts);
      expect(result).toEqual(createdProducts);
    });
  });

  describe('count', () => {
    it('should return the count of products', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should return 0 when no products exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });
});
