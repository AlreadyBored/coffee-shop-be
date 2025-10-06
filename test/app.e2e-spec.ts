import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return API information', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'message',
            'Coffee House API is running!',
          );
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('version', '1.0.0');
          expect(res.body.data).toHaveProperty('endpoints');
          expect(res.body.data.endpoints).toHaveProperty('products');
          expect(res.body.data.endpoints).toHaveProperty('auth');
          expect(res.body.data.endpoints).toHaveProperty('orders');
        });
    });
  });
});
