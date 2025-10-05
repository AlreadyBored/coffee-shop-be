import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export interface ProductSize {
  size: string;
  price: string;
  discountPrice?: string;
}

export interface ProductSizes {
  s?: ProductSize;
  m?: ProductSize;
  l?: ProductSize;
  xl?: ProductSize;
  xxl?: ProductSize;
}

export interface ProductAdditive {
  name: string;
  price: string;
  discountPrice?: string;
}

@Entity('products')
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Irish coffee' })
  @Column()
  name: string;

  @ApiProperty({
    example:
      'Fragrant black coffee with Jameson Irish whiskey and whipped milk',
  })
  @Column()
  description: string;

  @ApiProperty({ example: '7.00' })
  @Column()
  price: string;

  @ApiProperty({ example: '6.75', required: false })
  @Column({ nullable: true })
  discountPrice: string;

  @ApiProperty({ example: 'coffee' })
  @Column()
  category: string;

  @ApiProperty({
    description: 'Available sizes with prices',
    example: {
      s: { size: '200 ml', price: '7.00' },
      m: { size: '300 ml', price: '8.50', discountPrice: '8.25' },
    },
  })
  @Column('text', {
    transformer: {
      to: (value: ProductSizes) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  sizes: ProductSizes;

  @ApiProperty({
    description: 'Available additives with prices',
    example: [
      { name: 'Sugar', price: '0.50', discountPrice: '0.45' },
      { name: 'Cinnamon', price: '0.50' },
    ],
  })
  @Column('text', {
    transformer: {
      to: (value: ProductAdditive[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  additives: ProductAdditive[];
}
