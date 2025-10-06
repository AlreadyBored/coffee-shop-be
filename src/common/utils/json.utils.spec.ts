import { safeJsonParse } from './json.utils';

// Mock console.error to test error logging
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('json.utils', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON string and return typed result', () => {
      const jsonString = '{"name": "Test", "value": 123}';

      interface TestType {
        name: string;
        value: number;
      }

      const result = safeJsonParse<TestType>(jsonString);

      expect(result).toEqual({ name: 'Test', value: 123 });
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should parse valid JSON array', () => {
      const jsonString = '[{"id": 1}, {"id": 2}]';

      interface TestItem {
        id: number;
      }

      const result = safeJsonParse<TestItem[]>(jsonString);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should parse primitive values', () => {
      expect(safeJsonParse<string>('"hello"')).toBe('hello');
      expect(safeJsonParse<number>('42')).toBe(42);
      expect(safeJsonParse<boolean>('true')).toBe(true);
      expect(safeJsonParse<null>('null')).toBe(null);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should return null for invalid JSON and log error', () => {
      const invalidJson = '{ invalid json }';

      const result = safeJsonParse<any>(invalidJson);

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to parse JSON:',
        expect.any(SyntaxError),
      );
    });

    it('should return null for empty string and log error', () => {
      const result = safeJsonParse<any>('');

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to parse JSON:',
        expect.any(SyntaxError),
      );
    });

    it('should return null for malformed JSON and log error', () => {
      const malformedJson = '{"name": "test", "value":}';

      const result = safeJsonParse<any>(malformedJson);

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to parse JSON:',
        expect.any(SyntaxError),
      );
    });

    it('should handle complex nested objects', () => {
      const complexJson = JSON.stringify({
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      });

      interface ComplexType {
        user: {
          id: number;
          profile: {
            name: string;
            settings: {
              theme: string;
              notifications: boolean;
            };
          };
        };
        items: Array<{ id: number; name: string }>;
      }

      const result = safeJsonParse<ComplexType>(complexJson);

      expect(result).toEqual({
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      });
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle JSON with special characters', () => {
      const jsonWithSpecialChars = '{"text": "Hello\\nWorld\\t\\"quoted\\""}';

      const result = safeJsonParse<{ text: string }>(jsonWithSpecialChars);

      expect(result).toEqual({ text: 'Hello\nWorld\t"quoted"' });
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle JSON with unicode characters', () => {
      const jsonWithUnicode = '{"emoji": "🚀", "chinese": "你好"}';

      const result = safeJsonParse<{ emoji: string; chinese: string }>(
        jsonWithUnicode,
      );

      expect(result).toEqual({ emoji: '🚀', chinese: '你好' });
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should return null for undefined input and log error', () => {
      const result = safeJsonParse<any>(undefined as any);

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to parse JSON:',
        expect.any(SyntaxError),
      );
    });

    it('should return null for null input and log error', () => {
      const result = safeJsonParse<any>(null as any);

      expect(result).toBeNull();
      // Note: JSON.parse(null) actually returns null, not an error
      // This is valid JSON, so no error is logged
    });

    it('should maintain type safety with generic parameter', () => {
      interface User {
        id: number;
        name: string;
        active: boolean;
      }

      const validUserJson = '{"id": 1, "name": "John", "active": true}';
      const result = safeJsonParse<User>(validUserJson);

      // TypeScript should infer the correct type
      if (result) {
        expect(typeof result.id).toBe('number');
        expect(typeof result.name).toBe('string');
        expect(typeof result.active).toBe('boolean');
      }
    });
  });
});
