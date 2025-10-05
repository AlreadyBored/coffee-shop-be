import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OptionalUser } from '../auth/optional-user.decorator';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import { User } from '../../entities/user.entity';
import {
  OrderResponseDto,
  ErrorResponseDto,
} from '../../common/dto/response.dto';

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

  /**
   * POST /orders/confirm-auth
   * Order confirmation (for authenticated users only)
   */
  @Post('confirm-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm order (authenticated users only)' })
  @ApiBody({ type: CreateOrderDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Order confirmed successfully',
    type: OrderResponseDto,
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async confirmOrderAuth(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
  ): Promise<ApiResponse<{ message: string; orderId: string }>> {
    try {
      const result = await this.ordersService.confirmOrder(
        createOrderDto,
        req.user,
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
