import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, PaymentMethod } from '../src/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

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

  describe('/auth/register (POST)', () => {
    const validRegisterDto = {
      login: 'testuser',
      password: 'password123',
      confirmPassword: 'password123',
      city: 'Test City',
      street: 'Test Street',
      houseNumber: 123,
      paymentMethod: PaymentMethod.CARD,
    };

    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty('login', 'testuser');
          expect(res.body.data.user).toHaveProperty('city', 'Test City');
          expect(res.body.data.user).not.toHaveProperty('password');
        });
    });

    it('should return 400 when passwords do not match', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterDto,
          confirmPassword: 'differentpassword',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 409 when user already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      // Second registration with same login
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 400 for invalid input data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          login: '', // Invalid: empty login
          password: '123', // Invalid: too short
          city: 'Test City',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          login: 'testuser',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const registerDto = {
      login: 'loginuser',
      password: 'password123',
      confirmPassword: 'password123',
      city: 'Test City',
      street: 'Test Street',
      houseNumber: 123,
      paymentMethod: PaymentMethod.CARD,
    };

    const loginDto = {
      login: 'loginuser',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty('login', 'loginuser');
          expect(res.body.data.user).not.toHaveProperty('password');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'loginuser',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'nonexistentuser',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should return 400 for invalid input data', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: '', // Invalid: empty login
          password: '', // Invalid: empty password
        })
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;
    const registerDto = {
      login: 'profileuser',
      password: 'password123',
      confirmPassword: 'password123',
      city: 'Profile City',
      street: 'Profile Street',
      houseNumber: 456,
      paymentMethod: PaymentMethod.CASH,
    };

    beforeEach(async () => {
      // Register and login to get access token
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      accessToken = registerResponse.body.data.access_token;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('login', 'profileuser');
          expect(res.body.data).toHaveProperty('city', 'Profile City');
          expect(res.body.data).toHaveProperty(
            'paymentMethod',
            PaymentMethod.CASH,
          );
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });
});
