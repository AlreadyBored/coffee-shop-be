import { ApiProperty } from '@nestjs/swagger';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export class ProductListItem {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Irish coffee' })
  name: string;

  @ApiProperty({
    example:
      'Fragrant black coffee with Jameson Irish whiskey and whipped milk',
  })
  description: string;

  @ApiProperty({ example: '7.00' })
  price: string;

  @ApiProperty({ example: '6.75', required: false })
  discountPrice?: string | null;

  @ApiProperty({ example: 'coffee' })
  category: string;
}

export interface OrderItem {
  productId: number;
  size: string;
  additives: string[];
  quantity: number;
}

export interface OrderRequest {
  items: OrderItem[];
  totalPrice: number;
}
