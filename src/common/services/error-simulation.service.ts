import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

interface TestErrorResponse {
  error: string;
  isTestError: true;
  timestamp: string;
}

@Injectable()
export class ErrorSimulationService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Simulates random API errors for testing purposes.
   * Throws a 500 HTTP error with configurable probability.
   * The error includes isTestError: true to differentiate from real errors.
   *
   * @param customProbability - Optional custom probability to override config
   */
  simulateRandomError(customProbability?: number): void {
    const probability =
      customProbability ??
      this.configService.get<number>('errorSimulation.probability', 0.25);

    const shouldThrowError = Math.random() < probability;

    if (shouldThrowError) {
      const testErrorResponse: TestErrorResponse = {
        error: 'Simulated API error for testing purposes',
        isTestError: true,
        timestamp: new Date().toISOString(),
      };

      throw new HttpException(
        testErrorResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if an error response is a test error.
   */
  isTestError(errorResponse: any): boolean {
    return errorResponse?.isTestError === true;
  }
}
