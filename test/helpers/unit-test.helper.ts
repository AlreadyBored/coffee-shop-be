import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Helper function for unit tests to handle random error simulation.
 * Wraps test execution to handle both success and simulated test errors.
 */
export async function expectSuccessOrTestErrorUnit<T>(
  testFunction: () => Promise<T>,
  successValidator?: (result: T) => void,
): Promise<void> {
  try {
    const result = await testFunction();

    // If we get here, the test function succeeded (no random error was thrown)
    if (successValidator) {
      successValidator(result);
    }
  } catch (error) {
    // Check if this is a test error (simulated random error)
    if (error instanceof HttpException) {
      const response = error.getResponse();

      // If it's a test error with isTestError: true, that's acceptable
      if (
        typeof response === 'object' &&
        response !== null &&
        'isTestError' in response &&
        (response as any).isTestError === true
      ) {
        // Validate test error structure
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty(
          'error',
          'Simulated API error for testing purposes',
        );
        expect(response).toHaveProperty('isTestError', true);
        expect(response).toHaveProperty('timestamp');
        return; // Accept the test error
      }
    }

    // If it's not a test error, re-throw it to fail the test
    throw error;
  }
}

/**
 * Helper function for unit tests that should specifically test error cases.
 * Ensures that if a random test error occurs, we can still validate the intended error handling.
 */
export async function expectSpecificErrorOrTestErrorUnit(
  testFunction: () => Promise<any>,
  expectedErrorValidator: (error: HttpException) => void,
): Promise<void> {
  try {
    await testFunction();

    // If we get here without an error, the test should fail
    // because we expected an error to be thrown
    throw new Error('Expected function to throw an error, but it succeeded');
  } catch (error) {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      // Check if this is a test error (simulated random error)
      if (
        typeof response === 'object' &&
        response !== null &&
        'isTestError' in response &&
        (response as any).isTestError === true
      ) {
        // It's a test error - validate its structure and accept it
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty(
          'error',
          'Simulated API error for testing purposes',
        );
        expect(response).toHaveProperty('isTestError', true);
        expect(response).toHaveProperty('timestamp');
        return; // Accept the test error
      }

      // It's a real error - validate it with the provided validator
      expectedErrorValidator(error);
    } else {
      // Re-throw non-HttpException errors
      throw error;
    }
  }
}

/**
 * Mock the simulateRandomError function to control when it throws errors in tests.
 * Use this in beforeEach to reset the mock state.
 */
export function mockSimulateRandomError(): jest.MockedFunction<() => void> {
  // Mock the entire module
  jest.doMock('../../src/common/utils/error-simulation.util', () => ({
    simulateRandomError: jest.fn(),
    isTestError: jest.requireActual(
      '../../src/common/utils/error-simulation.util',
    ).isTestError,
  }));

  const {
    simulateRandomError,
  } = require('../../src/common/utils/error-simulation.util'); // eslint-disable-line @typescript-eslint/no-var-requires
  return simulateRandomError as jest.MockedFunction<() => void>;
}

/**
 * Force the simulateRandomError to throw a test error.
 * Useful for testing the error handling path specifically.
 */
export function forceTestError(
  mockSimulateRandomError: jest.MockedFunction<() => void>,
): void {
  mockSimulateRandomError.mockImplementationOnce(() => {
    const testErrorResponse = {
      error: 'Simulated API error for testing purposes',
      isTestError: true,
      timestamp: new Date().toISOString(),
    };

    throw new HttpException(
      testErrorResponse,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
}

/**
 * Ensure the simulateRandomError does not throw an error.
 * Useful for testing the success path specifically.
 */
export function preventTestError(
  mockSimulateRandomError: jest.MockedFunction<() => void>,
): void {
  mockSimulateRandomError.mockImplementationOnce(() => {
    // Do nothing - no error thrown
  });
}
