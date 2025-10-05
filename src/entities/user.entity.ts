import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  login: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  city: string;

  @Column()
  street: string;

  @Column()
  houseNumber: number;

  @Column({
    type: 'text',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;
}
