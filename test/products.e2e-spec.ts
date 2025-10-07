import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../src/entities/product.entity';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;

  const mockProducts = [
    {
      name: 'Test Coffee 1',
      description: 'A test coffee product',
      price: '5.99',
      discountPrice: null,
      category: 'coffee',
      sizes: {
        s: { size: '200 ml', price: '5.99' },
        m: { size: '300 ml', price: '6.99' },
      },
      additives: [
        { name: 'Sugar', price: '0.50' },
        { name: 'Milk', price: '0.75' },
      ],
    },
    {
      name: 'Test Coffee 2',
      description: 'Another test coffee product',
      price: '6.99',
      discountPrice: '5.99',
      category: 'coffee',
      sizes: {
        m: { size: '300 ml', price: '6.99' },
        l: { size: '400 ml', price: '7.99' },
      },
      additives: [{ name: 'Vanilla', price: '1.00' }],
    },
    {
      name: 'Test Tea',
      description: 'A test tea product',
      price: '3.99',
      discountPrice: null,
      category: 'tea',
      sizes: {
        s: { size: '200 ml', price: '3.99' },
      },
      additives: [],
    },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Get repository and seed test data
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    // Clear existing data and seed test products
    await productRepository.clear();
    await productRepository.save(mockProducts);
  });

  afterEach(async () => {
    // Clean up test data
    await productRepository.clear();
    await app.close();
  });

  describe('/products/favorites (GET)', () => {
    it('should return random coffee products', () => {
      return request(app.getHttpServer())
        .get('/products/favorites')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data.length).toBeLessThanOrEqual(3);

          // All returned products should be coffee
          res.body.data.forEach((product: any) => {
            expect(product.category).toBe('coffee');
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('description');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('category');
            // Should not include sizes and additives
            expect(product).not.toHaveProperty('sizes');
            expect(product).not.toHaveProperty('additives');
          });
        });
    });

    it('should handle case when no coffee products exist', async () => {
      // Remove all coffee products
      await productRepository.delete({ category: 'coffee' });

      return request(app.getHttpServer())
        .get('/products/favorites')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(0);
        });
    });
  });

  describe('/products (GET)', () => {
    it('should return all products without sizes and additives', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(3);

          res.body.data.forEach((product: any) => {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('description');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('category');
            // Should not include sizes and additives
            expect(product).not.toHaveProperty('sizes');
            expect(product).not.toHaveProperty('additives');
          });
        });
    });

    it('should return empty array when no products exist', async () => {
      await productRepository.clear();

      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(0);
        });
    });
  });

  describe('/products/:id (GET)', () => {
    let productId: number;

    beforeEach(async () => {
      const products = await productRepository.find();
      productId = products[0].id;
    });

    it('should return full product details by ID', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', productId);
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('description');
          expect(res.body.data).toHaveProperty('price');
          expect(res.body.data).toHaveProperty('category');
          expect(res.body.data).toHaveProperty('sizes');
          expect(res.body.data).toHaveProperty('additives');

          // Verify sizes structure
          expect(typeof res.body.data.sizes).toBe('object');

          // Verify additives structure
          expect(Array.isArray(res.body.data.additives)).toBe(true);
        });
    });

    it('should return 404 for non-existent product ID', () => {
      const nonExistentId = 99999;

      return request(app.getHttpServer())
        .get(`/products/${nonExistentId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 400 for invalid product ID format', () => {
      return request(app.getHttpServer())
        .get('/products/invalid-id')
        .expect(400);
    });

    it('should return 404 for negative product ID', () => {
      return request(app.getHttpServer())
        .get('/products/-1')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 404 for zero product ID', () => {
      return request(app.getHttpServer())
        .get('/products/0')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });
  });

  describe('Product data integrity', () => {
    it('should maintain consistent data structure across endpoints', async () => {
      const products = await productRepository.find();
      const testProductId = products[0].id;

      // Get product from list endpoint
      const listResponse = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const productFromList = listResponse.body.data.find(
        (p: any) => p.id === testProductId,
      );

      // Get same product from detail endpoint
      const detailResponse = await request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200);

      const productFromDetail = detailResponse.body.data;

      // Compare common fields
      expect(productFromList.id).toBe(productFromDetail.id);
      expect(productFromList.name).toBe(productFromDetail.name);
      expect(productFromList.description).toBe(productFromDetail.description);
      expect(productFromList.price).toBe(productFromDetail.price);
      expect(productFromList.category).toBe(productFromDetail.category);
    });

    it('should handle products with discount prices correctly', async () => {
      const products = await productRepository.find();
      const productWithDiscount = products.find(
        (p) => p.discountPrice !== null,
      );

      if (productWithDiscount) {
        const response = await request(app.getHttpServer())
          .get(`/products/${productWithDiscount.id}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('discountPrice');
        expect(response.body.data.discountPrice).not.toBeNull();
      }
    });

    it('should handle products without discount prices correctly', async () => {
      const products = await productRepository.find();
      const productWithoutDiscount = products.find(
        (p) => p.discountPrice === null,
      );

      if (productWithoutDiscount) {
        const response = await request(app.getHttpServer())
          .get(`/products/${productWithoutDiscount.id}`)
          .expect(200);

        expect(response.body.data.discountPrice).toBeNull();
      }
    });
  });
});
