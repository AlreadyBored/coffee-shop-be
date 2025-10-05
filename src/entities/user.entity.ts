import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john123' })
  @Column({ unique: true, length: 50 })
  login: string;

  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ example: 'New York' })
  @Column()
  city: string;

  @ApiProperty({ example: 'Main Street' })
  @Column()
  street: string;

  @ApiProperty({ example: 123 })
  @Column()
  houseNumber: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @Column({
    type: 'text',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
