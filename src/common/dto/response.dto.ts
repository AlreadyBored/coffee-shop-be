import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../entities/product.entity';
import { ProductListItem } from '../interfaces/api.interfaces';
import { UserPublicDto } from './user.dto';

// Base response wrapper
export class BaseResponseDto<T> {
  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  error?: string;
}

// Auth responses
export class AuthTokenDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({
    description: 'User information without password',
    type: UserPublicDto,
  })
  user: UserPublicDto;
}

export class AuthResponseDto extends BaseResponseDto<AuthTokenDto> {
  @ApiProperty()
  data: AuthTokenDto;

  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

export class ProfileResponseDto extends BaseResponseDto<UserPublicDto> {
  @ApiProperty({ type: UserPublicDto })
  data: UserPublicDto;
}

// Product responses
export class ProductsListResponseDto extends BaseResponseDto<Product[]> {
  @ApiProperty({ type: [Product] })
  data: Product[];
}

export class ProductListItemsResponseDto extends BaseResponseDto<
  ProductListItem[]
> {
  @ApiProperty({ type: [ProductListItem] })
  data: ProductListItem[];
}

export class ProductResponseDto extends BaseResponseDto<Product> {
  @ApiProperty()
  data: Product;
}

// Order responses
export class OrderConfirmationDto {
  @ApiProperty({ example: 'Your order is confirmed' })
  message: string;

  @ApiProperty({ example: 'ORDER-1696518000000-ABC123DEF' })
  orderId: string;
}

export class OrderResponseDto extends BaseResponseDto<OrderConfirmationDto> {
  @ApiProperty()
  data: OrderConfirmationDto;
}

// App info response
export class ApiEndpointsDto {
  @ApiProperty({
    example: {
      'GET /products/favorites': 'Get 3 random coffee products for main page',
      'GET /products': 'Get all products (without sizes and additives)',
      'GET /products/:id': 'Get full product details by ID',
    },
  })
  products: Record<string, string>;

  @ApiProperty({
    example: {
      'POST /auth/register': 'Register new user',
      'POST /auth/login': 'User login',
      'GET /auth/profile': 'Get current user profile (protected)',
    },
  })
  auth: Record<string, string>;

  @ApiProperty({
    example: {
      'POST /orders/confirm': 'Confirm order (anonymous or authenticated)',
      'POST /orders/confirm-auth': 'Confirm order (authenticated only)',
    },
  })
  orders: Record<string, string>;
}

export class ApiInfoDto {
  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty()
  endpoints: ApiEndpointsDto;
}

export class AppInfoResponseDto extends BaseResponseDto<ApiInfoDto> {
  @ApiProperty({ example: 'Coffee House API is running!' })
  message: string;

  @ApiProperty()
  data: ApiInfoDto;
}

// Error responses
export class ErrorResponseDto {
  @ApiProperty({ example: 'Invalid credentials' })
  error: string;
}
