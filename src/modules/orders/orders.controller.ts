import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OptionalUser } from '../auth/optional-user.decorator';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import { User } from '../../entities/user.entity';
import {
  OrderResponseDto,
  ErrorResponseDto,
} from '../../common/dto/response.dto';
import { simulateRandomError } from '../../common/utils/error-simulation.util';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('confirm')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Confirm order (anonymous or authenticated)' })
  @ApiBody({ type: CreateOrderDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Order confirmed successfully',
    type: OrderResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async confirmOrder(
    @Body() createOrderDto: CreateOrderDto,
    @OptionalUser() user: User | null,
  ): Promise<ApiResponse<{ message: string; orderId: string }>> {
    // Simulate random API errors for testing
    simulateRandomError();

    try {
      const result = await this.ordersService.confirmOrder(
        createOrderDto,
        user,
      );

      return {
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to confirm order',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
