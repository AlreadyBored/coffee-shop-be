import { HttpException, HttpStatus } from '@nestjs/common';

export interface TestErrorResponse {
  error: string;
  isTestError: true;
  timestamp: string;
}

/**
 * Default probability for random error simulation (25%)
 */
export const DEFAULT_ERROR_PROBABILITY = 0.25;

/**
 * Simulates random API errors for testing purposes.
 * Throws a 500 HTTP error with configurable probability.
 * The error includes isTestError: true to differentiate from real errors.
 *
 * @param probability - Error probability (0-1), defaults to 25% or env variable TEST_ERROR_PROBABILITY
 */
export function simulateRandomError(probability?: number): void {
  const errorProbability =
    probability ??
    (parseFloat(process.env.TEST_ERROR_PROBABILITY || '') ||
      DEFAULT_ERROR_PROBABILITY);

  const shouldThrowError = Math.random() < errorProbability;

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
