/**
 * Safely parse JSON string with type safety
 * @param jsonString - The JSON string to parse
 * @returns Parsed data of type T or null if parsing fails
 */
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}
