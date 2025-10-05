import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../../common/dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import { User } from '../../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register new user
   */
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<
    ApiResponse<{ access_token: string; user: Omit<User, 'password'> }>
  > {
    try {
      const result = await this.authService.register(registerDto);
      return {
        success: true,
        data: result,
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error.status === 400 || error.status === 409) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
          },
          error.status,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: 'Registration failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /auth/login
   * User login
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<
    ApiResponse<{ access_token: string; user: Omit<User, 'password'> }>
  > {
    try {
      const result = await this.authService.login(loginDto);
      return {
        success: true,
        data: result,
        message: 'Login successful',
      };
    } catch (error) {
      if (error.status === 401) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
          },
          error.status,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: 'Login failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /auth/profile
   * Get current user profile (protected endpoint)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Request() req,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
    try {
      return {
        success: true,
        data: req.user,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch profile',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
