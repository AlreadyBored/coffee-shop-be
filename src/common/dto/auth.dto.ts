import {
  IsString,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { PaymentMethod } from '../../entities/user.entity';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z][A-Za-z0-9]*$/, {
    message:
      'Login must start with a letter and contain only English letters and numbers',
  })
  login: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z][A-Za-z0-9]*$/, {
    message:
      'Login must start with a letter and contain only English letters and numbers',
  })
  login: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsNumber()
  @Min(1)
  houseNumber: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
