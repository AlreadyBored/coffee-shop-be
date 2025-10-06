import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock the entity file to avoid Swagger decorator issues
jest.mock('../../entities/user.entity', () => ({
  User: class User {
    id: number;
    login: string;
    password: string;
    city: string;
    street: string;
    houseNumber: number;
    paymentMethod: string;
    createdAt: Date;
  },
  PaymentMethod: {
    CASH: 'cash',
    CARD: 'card',
  },
}));

import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '../../common/dto/auth.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock lodash
jest.mock('lodash', () => ({
  omit: jest.fn((obj, keys) => {
    const result = { ...obj };
    // Handle both string and array of keys
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach((key) => delete result[key]);
    return result;
  }),
}));

// Import the mocked classes
import { User, PaymentMethod } from '../../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: 1,
    login: 'testuser',
    password: 'hashedpassword',
    city: 'Test City',
    street: 'Test Street',
    houseNumber: 123,
    paymentMethod: PaymentMethod.CARD,
    createdAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        ...registerDto,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        id: 2,
        ...registerDto,
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { login: registerDto.login },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        login: registerDto.login,
        password: 'hashedpassword',
        city: registerDto.city,
        street: registerDto.street,
        houseNumber: registerDto.houseNumber,
        paymentMethod: registerDto.paymentMethod,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: 2,
        login: registerDto.login,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: expect.objectContaining({
          login: registerDto.login,
          city: registerDto.city,
        }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const invalidDto = { ...registerDto, confirmPassword: 'different' };

      await expect(service.register(invalidDto)).rejects.toThrow(
        new BadRequestException('Passwords do not match'),
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this login already exists'),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      login: 'testuser',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { login: loginDto.login },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        login: mockUser.login,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: expect.objectContaining({
          id: mockUser.id,
          login: mockUser.login,
        }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          login: mockUser.login,
        }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user without password when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          login: mockUser.login,
        }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
