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
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../../common/dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import { User } from '../../entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register new user
   */
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                login: { type: 'string' },
                city: { type: 'string' },
                street: { type: 'string' },
                houseNumber: { type: 'string' },
                paymentMethod: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Bad request' })
  @SwaggerApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<
    ApiResponse<{ access_token: string; user: Omit<User, 'password'> }>
  > {
    try {
      const result = await this.authService.register(registerDto);
      return {
        data: result,
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error.status === 400 || error.status === 409) {
        throw new HttpException(
          {
            error: error.message,
          },
          error.status,
        );
      }
      throw new HttpException(
        {
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
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                login: { type: 'string' },
                city: { type: 'string' },
                street: { type: 'string' },
                houseNumber: { type: 'string' },
                paymentMethod: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @SwaggerApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<
    ApiResponse<{ access_token: string; user: Omit<User, 'password'> }>
  > {
    try {
      const result = await this.authService.login(loginDto);
      return {
        data: result,
        message: 'Login successful',
      };
    } catch (error) {
      if (error.status === 401) {
        throw new HttpException(
          {
            error: error.message,
          },
          error.status,
        );
      }
      throw new HttpException(
        {
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            login: { type: 'string' },
            city: { type: 'string' },
            street: { type: 'string' },
            houseNumber: { type: 'string' },
            paymentMethod: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @Request() req,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
    try {
      return {
        data: req.user,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch profile',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
