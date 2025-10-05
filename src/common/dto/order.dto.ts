import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: 'Product size',
    example: 'm',
  })
  @IsString()
  size: string;

  @ApiProperty({
    description: 'Product additives',
    example: ['Sugar', 'Cinnamon'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  additives: string[];

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 15.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalPrice: number;
}
