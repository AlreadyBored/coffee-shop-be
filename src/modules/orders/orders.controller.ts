import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponse } from '../../common/interfaces/api.interfaces';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('confirm')
  async confirmOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
  ): Promise<ApiResponse<{ message: string; orderId: string }>> {
    try {
      let user;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const jwtGuard = new JwtAuthGuard();
          await jwtGuard.canActivate({
            ...req,
            switchToHttp: () => ({
              getRequest: () => req,
            }),
          });
          user = req.user;
        }
      } catch (error) {
        user = null;
      }

      const result = await this.ordersService.confirmOrder(
        createOrderDto,
        user,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
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
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to confirm order',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
