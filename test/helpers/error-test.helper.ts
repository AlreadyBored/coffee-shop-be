import { Test } from 'supertest';

/**
 * Helper function to handle test errors in E2E tests.
 * Accepts 500 errors with isTestError: true as valid responses,
 * but fails on unexpected 500 errors without this flag.
 */
export function expectSuccessOrTestError(
  request: Test,
  expectedSuccessStatus: number = 200,
): Test {
  return request.expect((res) => {
    // If it's a success response, check the expected status
    if (res.status === expectedSuccessStatus) {
      return; // Success - no further checks needed
    }

    // If it's a 500 error, check if it's a test error
    if (res.status === 500) {
      // Must be a test error with isTestError: true
      if (res.body?.isTestError === true) {
        // Validate test error structure
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('isTestError', true);
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body.error).toBe('Simulated API error for testing purposes');
        return; // Valid test error - accept it
      } else {
        // This is an unexpected 500 error - fail the test
        throw new Error(
          `Unexpected 500 error without isTestError flag: ${JSON.stringify(res.body)}`,
        );
      }
    }

    // Any other status code is unexpected for this helper
    throw new Error(
      `Unexpected response status ${res.status}. Expected ${expectedSuccessStatus} or 500 with isTestError: true`,
    );
  });
}

/**
 * Helper function to handle test errors for endpoints that can return specific error status codes.
 * Accepts either the expected status or 500 with isTestError: true.
 */
export function expectSpecificStatusOrTestError(
  request: Test,
  expectedStatus: number,
): Test {
  return request.expect((res) => {
    // If it's the expected status, continue with normal expectations
    if (res.status === expectedStatus) {
      return;
    }

    // If it's a 500 error, check if it's a test error
    if (res.status === 500) {
      // Must be a test error with isTestError: true
      if (res.body?.isTestError === true) {
        // Validate test error structure
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('isTestError', true);
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body.error).toBe('Simulated API error for testing purposes');
        return; // Valid test error - accept it
      } else {
        // This is an unexpected 500 error - fail the test
        throw new Error(
          `Unexpected 500 error without isTestError flag: ${JSON.stringify(res.body)}`,
        );
      }
    }

    // Any other status code is unexpected for this helper
    throw new Error(
      `Unexpected response status ${res.status}. Expected ${expectedStatus} or 500 with isTestError: true`,
    );
  });
}

/**
 * Retry a request multiple times to handle random test errors.
 * Useful when you need to ensure the success path works despite random errors.
 */
export async function retryUntilSuccess(
  requestFactory: () => Test,
  maxRetries: number = 10,
  expectedSuccessStatus: number = 200,
): Promise<any> {
  let lastError: Error | null = null;
  let lastResponse: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFactory();

      if (response.status === expectedSuccessStatus) {
        return response;
      }

      // If it's a test error, continue retrying
      if (response.status === 500 && response.body?.isTestError === true) {
        lastResponse = response;
        continue;
      }

      // Unexpected error
      throw new Error(
        `Unexpected response status ${response.status} on attempt ${attempt}`,
      );
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw new Error(
    `Failed to get successful response after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}. Last response: ${JSON.stringify(lastResponse?.body)}`,
  );
}
