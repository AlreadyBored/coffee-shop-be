import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from './common/interfaces/api.interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponse<any> {
    return {
      success: true,
      message: 'Coffee House API is running!',
      data: {
        version: '1.0.0',
        endpoints: {
          products: {
            'GET /products/favorites':
              'Get 3 random coffee products for main page',
            'GET /products': 'Get all products (without sizes and additives)',
            'GET /products/:id': 'Get full product details by ID',
          },
          auth: {
            'POST /auth/register': 'Register new user',
            'POST /auth/login': 'User login',
            'GET /auth/profile': 'Get current user profile (protected)',
          },
          orders: {
            'POST /orders/confirm':
              'Confirm order (anonymous or authenticated)',
            'POST /orders/confirm-auth': 'Confirm order (authenticated only)',
          },
        },
      },
    };
  }
}
