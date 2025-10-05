import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: string;

  @Column({ nullable: true })
  discountPrice: string;

  @Column()
  category: string;

  @Column('text', {
    transformer: {
      to: (value: ProductSizes) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  sizes: ProductSizes;

  @Column('text', {
    transformer: {
      to: (value: ProductAdditive[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  additives: ProductAdditive[];
}
