import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, PaymentMethod } from '../src/entities/user.entity';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const validOrderDto = {
    items: [
      {
        productId: 1,
        size: 'm',
        additives: ['Sugar', 'Milk'],
        quantity: 2,
      },
      {
        productId: 2,
        size: 's',
        additives: [],
        quantity: 1,
      },
    ],
    totalPrice: 16.97,
  };

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

    // Get repository for cleanup
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterEach(async () => {
    // Clean up test data
    await userRepository.clear();
    await app.close();
  });

  describe('/orders/confirm (POST)', () => {
    it('should confirm order', () => {
      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send(validOrderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty(
            'message',
            'Your order is confirmed',
          );
          expect(res.body.data).toHaveProperty('orderId');
          expect(typeof res.body.data.orderId).toBe('string');
          expect(res.body.data.orderId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
        });
    });

    it('should handle empty order items', () => {
      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send({
          items: [],
          totalPrice: 0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty(
            'message',
            'Your order is confirmed',
          );
          expect(res.body.data).toHaveProperty('orderId');
        });
    });

    it('should return 400 for invalid order data', () => {
      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send({
          items: 'invalid', // Should be array
          totalPrice: 'invalid', // Should be number
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send({
          items: validOrderDto.items,
          // Missing totalPrice
        })
        .expect(400);
    });

    it('should return 400 for negative total price', () => {
      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send({
          ...validOrderDto,
          totalPrice: -10.5,
        })
        .expect(400);
    });

    it('should handle order with single item', () => {
      const singleItemOrder = {
        items: [validOrderDto.items[0]],
        totalPrice: 12.98,
      };

      return request(app.getHttpServer())
        .post('/orders/confirm')
        .send(singleItemOrder)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('orderId');
        });
    });

    describe('Order validation', () => {
      it('should validate order item structure', () => {
        return request(app.getHttpServer())
          .post('/orders/confirm')
          .send({
            items: [
              {
                // Missing required fields
                productId: 1,
                // Missing size, additives, quantity
              },
            ],
            totalPrice: 10.0,
          })
          .expect(400);
      });

      it('should handle large orders', () => {
        const largeOrder = {
          items: Array(50)
            .fill(null)
            .map((_, index) => ({
              productId: index + 1,
              size: 'm',
              additives: ['Sugar'],
              quantity: 1,
            })),
          totalPrice: 299.5,
        };

        return request(app.getHttpServer())
          .post('/orders/confirm')
          .send(largeOrder)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('orderId');
          });
      });

      it('should handle order with zero-priced items', () => {
        const freeOrder = {
          items: [
            {
              productId: 1,
              size: 's',
              additives: [],
              quantity: 1,
            },
          ],
          totalPrice: 0,
        };

        return request(app.getHttpServer())
          .post('/orders/confirm')
          .send(freeOrder)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('orderId');
          });
      });
    });

    describe('Order ID generation', () => {
      it('should generate unique order IDs for multiple orders', async () => {
        const orderIds: string[] = [];

        // Create multiple orders
        for (let i = 0; i < 5; i++) {
          const response = await request(app.getHttpServer())
            .post('/orders/confirm')
            .send(validOrderDto)
            .expect(201);

          orderIds.push(response.body.data.orderId);
        }

        // Check that all IDs are unique
        const uniqueIds = new Set(orderIds);
        expect(uniqueIds.size).toBe(orderIds.length);

        // Check UUID format
        orderIds.forEach((id) => {
          expect(id).toMatch(/^[a-f0-9-]{36}$/);
        });
      });
    });

    describe('Error handling', () => {
      it('should handle malformed JSON', () => {
        return request(app.getHttpServer())
          .post('/orders/confirm')
          .set('Content-Type', 'application/json')
          .send('invalid json')
          .expect(400);
      });

      it('should handle empty request body', () => {
        return request(app.getHttpServer()).post('/orders/confirm').expect(400);
      });

      it('should reject request with extra properties (forbidden)', () => {
        return request(app.getHttpServer())
          .post('/orders/confirm')
          .send({
            ...validOrderDto,
            extraProperty: 'should be rejected',
            anotherExtra: 123,
          })
          .expect(400);
      });
    });
  });

  describe('Order flow integration', () => {
    it('should handle complete user journey: register -> login -> order', async () => {
      const registerDto = {
        login: 'journeyuser',
        password: 'password123',
        confirmPassword: 'password123',
        city: 'Journey City',
        street: 'Journey Street',
        houseNumber: 123,
        paymentMethod: PaymentMethod.CASH,
      };

      // 1. Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body.data).toHaveProperty('access_token');

      // 2. Login (optional, as we already have token from registration)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: registerDto.login,
          password: registerDto.password,
        })
        .expect(201);

      const accessToken = loginResponse.body.data.access_token;

      // 3. Place order
      const orderResponse = await request(app.getHttpServer())
        .post('/orders/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOrderDto)
        .expect(201);

      expect(orderResponse.body.data).toHaveProperty('orderId');
      expect(orderResponse.body.data).toHaveProperty(
        'message',
        'Your order is confirmed',
      );
    });

    it('should handle anonymous order flow', async () => {
      // Place order without authentication
      const orderResponse = await request(app.getHttpServer())
        .post('/orders/confirm')
        .send(validOrderDto)
        .expect(201);

      expect(orderResponse.body.data).toHaveProperty('orderId');
      expect(orderResponse.body.data).toHaveProperty(
        'message',
        'Your order is confirmed',
      );
    });
  });
});
