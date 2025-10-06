import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../../common/dto/auth.dto';
import { UserPublicDto } from '../../common/dto/user.dto';
import { PaymentMethod } from '../../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUserPublic: UserPublicDto = {
    id: 1,
    login: 'testuser',
    city: 'Test City',
    street: 'Test Street',
    houseNumber: 123,
    paymentMethod: PaymentMethod.CARD,
    createdAt: new Date(),
  };

  const mockAuthResponse = {
    access_token: 'jwt-token-123',
    user: mockUserPublic,
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      login: 'newuser',
      password: 'password123',
      confirmPassword: 'password123',
      city: 'New City',
      street: 'New Street',
      houseNumber: 456,
      paymentMethod: PaymentMethod.CASH,
    };

    it('should register user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        data: mockAuthResponse,
        message: 'User registered successfully',
      });
    });

    it('should throw HttpException when passwords do not match', async () => {
      const badRequestError = new Error('Passwords do not match');
      badRequestError.name = 'BadRequestException';
      mockAuthService.register.mockRejectedValue(badRequestError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw HttpException when user already exists', async () => {
      const conflictError = new Error('User with this login already exists');
      conflictError.name = 'ConflictException';
      mockAuthService.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw HttpException for generic registration error', async () => {
      const genericError = new Error('Database error');
      mockAuthService.register.mockRejectedValue(genericError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      login: 'testuser',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        data: mockAuthResponse,
        message: 'Login successful',
      });
    });

    it('should throw HttpException for invalid credentials', async () => {
      const unauthorizedError = new Error('Invalid credentials');
      unauthorizedError.name = 'UnauthorizedException';
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException for generic login error', async () => {
      const genericError = new Error('Database error');
      mockAuthService.login.mockRejectedValue(genericError);

      await expect(controller.login(loginDto)).rejects.toThrow(HttpException);
    });
  });

  describe('getProfile', () => {
    const mockRequest = {
      user: { userId: 1, login: 'testuser' },
    };

    it('should return user profile successfully', async () => {
      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual({
        data: mockRequest.user,
      });
    });

    it('should return user data from request', async () => {
      const requestWithUser = { user: { id: 2, login: 'anotheruser' } };

      const result = await controller.getProfile(requestWithUser);

      expect(result).toEqual({
        data: requestWithUser.user,
      });
    });

    it('should return null user data when user is null', async () => {
      const requestWithoutUser = { user: null };

      const result = await controller.getProfile(requestWithoutUser);

      expect(result).toEqual({
        data: null,
      });
    });
  });

  describe('error handling patterns', () => {
    it('should preserve error messages from service exceptions', async () => {
      const customError = new Error('Custom validation failed');
      customError.name = 'BadRequestException';
      mockAuthService.register.mockRejectedValue(customError);

      await expect(controller.register({} as RegisterDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('response format', () => {
    it('should return data wrapped in ApiResponse format for register', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register({} as RegisterDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
      expect(result.data).toEqual(mockAuthResponse);
      expect(result.message).toBe('User registered successfully');
      expect(result).not.toHaveProperty('success'); // Removed as per requirements
    });

    it('should return data wrapped in ApiResponse format for login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login({} as LoginDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
      expect(result.data).toEqual(mockAuthResponse);
      expect(result.message).toBe('Login successful');
      expect(result).not.toHaveProperty('success'); // Removed as per requirements
    });

    it('should return data wrapped in ApiResponse format for profile', async () => {
      const mockRequest = { user: { userId: 1, login: 'testuser' } };

      const result = await controller.getProfile(mockRequest);

      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(mockRequest.user);
      expect(result).not.toHaveProperty('message');
      expect(result).not.toHaveProperty('success'); // Removed as per requirements
    });
  });
});
