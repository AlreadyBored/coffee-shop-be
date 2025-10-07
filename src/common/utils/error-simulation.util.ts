import { HttpException, HttpStatus } from '@nestjs/common';

export interface TestErrorResponse {
  error: string;
  isTestError: true;
  timestamp: string;
}

/**
 * Simulates random API errors for testing purposes.
 * Throws a 500 HTTP error with ~25% probability.
 * The error includes isTestError: true to differentiate from real errors.
 */
export function simulateRandomError(): void {
  const shouldThrowError = Math.random() < 0.25; // 25% probability

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
 * Checks if an error response is a test error
 */
export function isTestError(errorResponse: any): boolean {
  return errorResponse?.isTestError === true;
}
