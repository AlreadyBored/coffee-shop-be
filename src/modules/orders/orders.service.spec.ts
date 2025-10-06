import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
import { User, PaymentMethod } from '../../entities/user.entity';
import { randomUUID } from 'node:crypto';

// Mock crypto module
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

// Mock console.log to test logging
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('OrdersService', () => {
  let service: OrdersService;

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

  const mockCreateOrderDto: CreateOrderDto = {
    items: [
      {
        productId: 1,
        quantity: 2,
        size: 'M',
        additives: ['Sugar', 'Milk'],
      },
      {
        productId: 2,
        quantity: 1,
        size: 'L',
        additives: [],
      },
    ],
    totalPrice: 15.99,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmOrder', () => {
    it('should confirm order with authenticated user', async () => {
      const mockOrderId = 'test-uuid-123';
      (randomUUID as jest.Mock).mockReturnValue(mockOrderId);

      const result = await service.confirmOrder(mockCreateOrderDto, mockUser);

      expect(randomUUID).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Your order is confirmed',
        orderId: mockOrderId,
      });

      // Verify logging
      expect(mockConsoleLog).toHaveBeenCalledWith('New order received:', {
        orderId: mockOrderId,
        user: mockUser.login,
        items: mockCreateOrderDto.items,
        totalPrice: mockCreateOrderDto.totalPrice,
        timestamp: expect.any(String),
      });
    });

    it('should confirm order with anonymous user', async () => {
      const mockOrderId = 'test-uuid-456';
      (randomUUID as jest.Mock).mockReturnValue(mockOrderId);

      const result = await service.confirmOrder(mockCreateOrderDto);

      expect(randomUUID).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Your order is confirmed',
        orderId: mockOrderId,
      });

      // Verify logging for anonymous user
      expect(mockConsoleLog).toHaveBeenCalledWith('New order received:', {
        orderId: mockOrderId,
        user: 'Anonymous',
        items: mockCreateOrderDto.items,
        totalPrice: mockCreateOrderDto.totalPrice,
        timestamp: expect.any(String),
      });
    });

    it('should confirm order with undefined user', async () => {
      const mockOrderId = 'test-uuid-789';
      (randomUUID as jest.Mock).mockReturnValue(mockOrderId);

      const result = await service.confirmOrder(mockCreateOrderDto, undefined);

      expect(result).toEqual({
        message: 'Your order is confirmed',
        orderId: mockOrderId,
      });

      // Verify logging for undefined user
      expect(mockConsoleLog).toHaveBeenCalledWith('New order received:', {
        orderId: mockOrderId,
        user: 'Anonymous',
        items: mockCreateOrderDto.items,
        totalPrice: mockCreateOrderDto.totalPrice,
        timestamp: expect.any(String),
      });
    });

    it('should generate unique order IDs for different orders', async () => {
      const mockOrderId1 = 'uuid-1';
      const mockOrderId2 = 'uuid-2';

      (randomUUID as jest.Mock)
        .mockReturnValueOnce(mockOrderId1)
        .mockReturnValueOnce(mockOrderId2);

      const result1 = await service.confirmOrder(mockCreateOrderDto, mockUser);
      const result2 = await service.confirmOrder(mockCreateOrderDto, mockUser);

      expect(result1.orderId).toBe(mockOrderId1);
      expect(result2.orderId).toBe(mockOrderId2);
      expect(result1.orderId).not.toBe(result2.orderId);
    });

    it('should handle empty items array', async () => {
      const mockOrderId = 'test-uuid-empty';
      (randomUUID as jest.Mock).mockReturnValue(mockOrderId);

      const emptyOrderDto: CreateOrderDto = {
        items: [],
        totalPrice: 0.0,
      };

      const result = await service.confirmOrder(emptyOrderDto, mockUser);

      expect(result).toEqual({
        message: 'Your order is confirmed',
        orderId: mockOrderId,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith('New order received:', {
        orderId: mockOrderId,
        user: mockUser.login,
        items: [],
        totalPrice: 0.0,
        timestamp: expect.any(String),
      });
    });

    it('should log timestamp in ISO format', async () => {
      const mockOrderId = 'test-uuid-timestamp';
      (randomUUID as jest.Mock).mockReturnValue(mockOrderId);

      // Mock Date to control timestamp
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;

      await service.confirmOrder(mockCreateOrderDto, mockUser);

      expect(mockConsoleLog).toHaveBeenCalledWith('New order received:', {
        orderId: mockOrderId,
        user: mockUser.login,
        items: mockCreateOrderDto.items,
        totalPrice: mockCreateOrderDto.totalPrice,
        timestamp: '2023-01-01T12:00:00.000Z',
      });

      // Restore original Date
      global.Date = originalDate;
    });
  });
});
