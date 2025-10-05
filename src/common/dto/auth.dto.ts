import {
  IsString,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../entities/user.entity';

export class LoginDto {
  @ApiProperty({
    description: 'User login',
    example: 'john123',
    minLength: 3,
    pattern: '^[A-Za-z][A-Za-z0-9]*$',
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z][A-Za-z0-9]*$/, {
    message:
      'Login must start with a letter and contain only English letters and numbers',
  })
  login: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User login',
    example: 'john123',
    minLength: 3,
    pattern: '^[A-Za-z][A-Za-z0-9]*$',
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z][A-Za-z0-9]*$/, {
    message:
      'Login must start with a letter and contain only English letters and numbers',
  })
  login: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({
    description: 'User city',
    example: 'New York',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'User street',
    example: 'Main Street',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'House number',
    example: 123,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  houseNumber: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
