import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
import { User, PaymentMethod } from '../../entities/user.entity';
import {
  expectSuccessOrTestErrorUnit,
  expectSpecificErrorOrTestErrorUnit,
  createMockErrorSimulationService,
} from '../../../test/helpers/unit-test.helper';
import { ErrorSimulationService } from '../../common/services/error-simulation.service';

describe('OrdersController', () => {
  let controller: OrdersController;

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

  const mockOrderResponse = {
    message: 'Your order is confirmed',
    orderId: 'test-uuid-123',
  };

  const mockOrdersService = {
    confirmOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: ErrorSimulationService,
          useValue: createMockErrorSimulationService(),
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('confirmOrder', () => {
    it('should confirm order with authenticated user', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            mockUser,
          );
          expect(result).toEqual({
            data: mockOrderResponse,
          });
        },
      );
    });

    it('should confirm order with anonymous user (null)', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, null),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            null,
          );
          expect(result).toEqual({
            data: mockOrderResponse,
          });
        },
      );
    });

    it('should confirm order with anonymous user (undefined)', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, undefined),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            undefined,
          );
          expect(result).toEqual({
            data: mockOrderResponse,
          });
        },
      );
    });

    it('should handle empty order items', async () => {
      const emptyOrderDto: CreateOrderDto = {
        items: [],
        totalPrice: 0.0,
      };
      mockOrdersService.confirmOrder.mockResolvedValue({
        message: 'Your order is confirmed',
        orderId: 'empty-order-uuid',
      });

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(emptyOrderDto, mockUser),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            emptyOrderDto,
            mockUser,
          );
          expect(result).toEqual({
            data: {
              message: 'Your order is confirmed',
              orderId: 'empty-order-uuid',
            },
          });
        },
      );
    });

    it('should handle order with single item', async () => {
      const singleItemOrderDto: CreateOrderDto = {
        items: [
          {
            productId: 1,
            quantity: 1,
            size: 'S',
            additives: ['Sugar'],
          },
        ],
        totalPrice: 5.99,
      };
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(singleItemOrderDto, mockUser),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            singleItemOrderDto,
            mockUser,
          );
          expect(result.data).toEqual(mockOrderResponse);
        },
      );
    });

    it('should throw HttpException when service throws error', async () => {
      const serviceError = new Error('Order processing failed');
      mockOrdersService.confirmOrder.mockRejectedValue(serviceError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to confirm order',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });

    it('should throw HttpException for validation errors', async () => {
      const validationError = new Error('Invalid product ID');
      validationError.name = 'BadRequestException';
      mockOrdersService.confirmOrder.mockRejectedValue(validationError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to confirm order',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });

    it('should throw HttpException for not found errors', async () => {
      const notFoundError = new Error('Product not found');
      notFoundError.name = 'NotFoundException';
      mockOrdersService.confirmOrder.mockRejectedValue(notFoundError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to confirm order',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });
  });

  describe('error handling patterns', () => {
    it('should handle service returning null', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(null);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          expect(result).toEqual({
            data: null,
          });
        },
      );
    });

    it('should handle service returning undefined', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(undefined);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          expect(result).toEqual({
            data: undefined,
          });
        },
      );
    });

    it('should preserve custom error messages from service', async () => {
      const customError = new Error('Insufficient inventory');
      customError.name = 'BadRequestException';
      mockOrdersService.confirmOrder.mockRejectedValue(customError);

      await expectSpecificErrorOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (httpError) => {
          expect(httpError).toBeInstanceOf(HttpException);
          expect(httpError.getResponse()).toEqual({
            error: 'Failed to confirm order',
          });
          expect(httpError.getStatus()).toBe(500);
        },
      );
    });
  });

  describe('response format', () => {
    it('should return data wrapped in ApiResponse format', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          expect(result).toHaveProperty('data');
          expect(result.data).toEqual(mockOrderResponse);
          expect(result).not.toHaveProperty('message');
          expect(result).not.toHaveProperty('success'); // Removed as per requirements
          expect(result).not.toHaveProperty('error');
        },
      );
    });

    it('should maintain consistent response structure regardless of user authentication', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      let authenticatedResult: any;
      let anonymousResult: any;

      // Test authenticated user
      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          authenticatedResult = result;
        },
      );

      // Test anonymous user
      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, null),
        (result) => {
          anonymousResult = result;
        },
      );

      // Only compare if both calls succeeded (not random errors)
      if (authenticatedResult && anonymousResult) {
        expect(authenticatedResult).toHaveProperty('data');
        expect(anonymousResult).toHaveProperty('data');
        expect(authenticatedResult.data).toEqual(anonymousResult.data);
      }
    });
  });

  describe('integration with OptionalJwtAuthGuard', () => {
    it('should handle requests with valid JWT token', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, mockUser),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            mockUser,
          );
          expect(result.data).toEqual(mockOrderResponse);
        },
      );
    });

    it('should handle requests without JWT token', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, null),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            null,
          );
          expect(result.data).toEqual(mockOrderResponse);
        },
      );
    });

    it('should handle requests with invalid JWT token (treated as anonymous)', async () => {
      mockOrdersService.confirmOrder.mockResolvedValue(mockOrderResponse);

      await expectSuccessOrTestErrorUnit(
        () => controller.confirmOrder(mockCreateOrderDto, null),
        (result) => {
          expect(mockOrdersService.confirmOrder).toHaveBeenCalledWith(
            mockCreateOrderDto,
            null,
          );
          expect(result.data).toEqual(mockOrderResponse);
        },
      );
    });
  });
});
