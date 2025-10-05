import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto, RegisterDto } from '../../common/dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import omit from 'lodash/omit';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register new user
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const {
      login,
      password,
      confirmPassword,
      city,
      street,
      houseNumber,
      paymentMethod,
    } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.userRepository.findOne({
      where: { login },
    });
    if (existingUser) {
      throw new ConflictException('User with this login already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = this.userRepository.create({
      login,
      password: hashedPassword,
      city,
      street,
      houseNumber,
      paymentMethod,
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload: JwtPayload = {
      userId: savedUser.id,
      login: savedUser.login,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: omit(savedUser, 'password'),
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const { login, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { userId: user.id, login: user.login };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: omit(user, 'password'),
    };
  }

  async validateUser(userId: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    return omit(user, 'password');
  }

  async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    return omit(user, 'password');
  }
}
