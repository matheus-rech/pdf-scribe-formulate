import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateSelectItems,
  toSelectValue,
  fromSelectValue,
  booleanSelectHelpers,
  isValidSelectValue,
  assertValidSelectValue,
} from './selectValidation';

describe('selectValidation', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    // Set to development for tests
    process.env.NODE_ENV = 'development';
    // Clear console error mock
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('validateSelectItems', () => {
    it('should pass validation for valid values', () => {
      expect(() => {
        validateSelectItems(['option1', 'option2', 'null'], 'TestComponent');
      }).not.toThrow();
    });

    it('should throw error for empty string value', () => {
      expect(() => {
        validateSelectItems(['option1', '', 'option3'], 'TestComponent');
      }).toThrow(/SelectItem with empty string value/);
    });

    it('should log detailed error message', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      try {
        validateSelectItems(['', 'valid', ''], 'TestComponent');
      } catch (e) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Select Validation Error in TestComponent')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found empty string value(s) at index: 0, 2')
      );
    });

    it('should not throw in production mode', () => {
      process.env.NODE_ENV = 'production';

      expect(() => {
        validateSelectItems(['option1', '', 'option3'], 'TestComponent');
      }).not.toThrow();
    });

    it('should handle null and undefined values without error', () => {
      expect(() => {
        validateSelectItems([null, undefined, 'valid'], 'TestComponent');
      }).not.toThrow();
    });
  });

  describe('toSelectValue', () => {
    it('should convert null to "null" by default', () => {
      expect(toSelectValue(null)).toBe('null');
    });

    it('should convert undefined to "null" by default', () => {
      expect(toSelectValue(undefined)).toBe('null');
    });

    it('should convert empty string to "null" by default', () => {
      expect(toSelectValue('')).toBe('null');
    });

    it('should pass through valid string values', () => {
      expect(toSelectValue('active')).toBe('active');
    });

    it('should convert numbers to strings', () => {
      expect(toSelectValue(42)).toBe('42');
    });

    it('should use custom empty value', () => {
      expect(toSelectValue(null, 'none')).toBe('none');
      expect(toSelectValue(undefined, 'unknown')).toBe('unknown');
    });
  });

  describe('fromSelectValue', () => {
    it('should convert "null" to null by default', () => {
      expect(fromSelectValue('null')).toBe(null);
    });

    it('should pass through other values', () => {
      expect(fromSelectValue('active')).toBe('active');
      expect(fromSelectValue('42')).toBe('42');
    });

    it('should use custom empty value', () => {
      expect(fromSelectValue('none', 'none')).toBe(null);
      expect(fromSelectValue('unknown', 'unknown')).toBe(null);
    });
  });

  describe('booleanSelectHelpers', () => {
    describe('toValue', () => {
      it('should convert true to "true"', () => {
        expect(booleanSelectHelpers.toValue(true)).toBe('true');
      });

      it('should convert false to "false"', () => {
        expect(booleanSelectHelpers.toValue(false)).toBe('false');
      });

      it('should convert null to "null"', () => {
        expect(booleanSelectHelpers.toValue(null)).toBe('null');
      });

      it('should convert undefined to "null"', () => {
        expect(booleanSelectHelpers.toValue(undefined)).toBe('null');
      });
    });

    describe('fromValue', () => {
      it('should convert "true" to true', () => {
        expect(booleanSelectHelpers.fromValue('true')).toBe(true);
      });

      it('should convert "false" to false', () => {
        expect(booleanSelectHelpers.fromValue('false')).toBe(false);
      });

      it('should convert "null" to null', () => {
        expect(booleanSelectHelpers.fromValue('null')).toBe(null);
      });
    });

    describe('options', () => {
      it('should provide standard yes/no/unknown options', () => {
        expect(booleanSelectHelpers.options).toEqual([
          { value: 'null', label: 'Unknown' },
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ]);
      });
    });
  });

  describe('isValidSelectValue', () => {
    it('should return true for non-empty strings', () => {
      expect(isValidSelectValue('valid')).toBe(true);
      expect(isValidSelectValue('0')).toBe(true);
    });

    it('should return true for numbers', () => {
      expect(isValidSelectValue(42)).toBe(true);
      expect(isValidSelectValue(0)).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isValidSelectValue('')).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isValidSelectValue(null)).toBe(false);
      expect(isValidSelectValue(undefined)).toBe(false);
      expect(isValidSelectValue(true)).toBe(false);
      expect(isValidSelectValue({})).toBe(false);
    });
  });

  describe('assertValidSelectValue', () => {
    it('should not throw for valid values', () => {
      expect(() => assertValidSelectValue('valid')).not.toThrow();
      expect(() => assertValidSelectValue(42)).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => assertValidSelectValue('')).toThrow(/Invalid Select value/);
    });

    it('should throw for null/undefined', () => {
      expect(() => assertValidSelectValue(null)).toThrow(/Invalid Select value/);
      expect(() => assertValidSelectValue(undefined)).toThrow(/Invalid Select value/);
    });

    it('should include component name in error', () => {
      expect(() => assertValidSelectValue('', 'MyComponent')).toThrow(
        /Invalid Select value in MyComponent/
      );
    });
  });

  describe('Round-trip conversions', () => {
    it('should preserve values through toSelectValue -> fromSelectValue', () => {
      const testCases = [null, 'active', 'inactive'];

      testCases.forEach((value) => {
        const selectValue = toSelectValue(value);
        const restored = fromSelectValue(selectValue);
        expect(restored).toBe(value);
      });
    });

    it('should preserve booleans through toValue -> fromValue', () => {
      const testCases = [true, false, null];

      testCases.forEach((value) => {
        const selectValue = booleanSelectHelpers.toValue(value);
        const restored = booleanSelectHelpers.fromValue(selectValue);
        expect(restored).toBe(value);
      });
    });
  });
});
