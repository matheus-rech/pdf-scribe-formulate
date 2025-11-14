/**
 * Select Component Validation Utilities
 * 
 * Provides runtime validation to catch common Select component mistakes
 * before they cause runtime errors in production.
 * 
 * Usage in development:
 * ```tsx
 * import { validateSelectItems } from '@/lib/selectValidation';
 * 
 * // In component (development only)
 * if (process.env.NODE_ENV === 'development') {
 *   validateSelectItems(['value1', 'value2', ''], 'MyComponent');
 * }
 * ```
 */

/**
 * Validates that no SelectItem values are empty strings
 * 
 * @param values - Array of values used in SelectItem components
 * @param componentName - Name of the component for error messages
 * @throws Error if any value is an empty string (development only)
 */
export function validateSelectItems(
  values: (string | number | undefined | null)[],
  componentName?: string
): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only run in development
  }

  const emptyIndices = values
    .map((val, idx) => ({ val, idx }))
    .filter(({ val }) => val === '')
    .map(({ idx }) => idx);

  if (emptyIndices.length > 0) {
    const location = componentName ? ` in ${componentName}` : '';
    const indices = emptyIndices.join(', ');
    
    console.error(
      `❌ Select Validation Error${location}:\n` +
      `Found empty string value(s) at index: ${indices}\n` +
      `Empty strings are not allowed in SelectItem components.\n` +
      `Use a meaningful string like "null", "none", or "unknown" instead.\n` +
      `See: docs/SELECT_COMPONENT_BEST_PRACTICES.md`
    );

    // Throw in development to fail fast
    throw new Error(
      `SelectItem with empty string value found${location}. ` +
      `Check console for details.`
    );
  }
}

/**
 * Creates a Select-safe value from a potentially null/undefined value
 * 
 * @param value - The raw value (can be null/undefined)
 * @param emptyValue - The string to use for empty states (default: "null")
 * @returns A valid Select value (never empty string)
 * 
 * @example
 * ```tsx
 * <Select value={toSelectValue(data.status)} onValueChange={onChange}>
 *   <SelectContent>
 *     <SelectItem value="null">Unknown</SelectItem>
 *     <SelectItem value="active">Active</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export function toSelectValue(
  value: string | number | null | undefined,
  emptyValue: string = 'null'
): string {
  if (value === null || value === undefined || value === '') {
    return emptyValue;
  }
  return String(value);
}

/**
 * Converts a Select value back to the original type
 * 
 * @param value - The value from the Select component
 * @param emptyValue - The string used for empty states (default: "null")
 * @returns The original value or null for empty states
 * 
 * @example
 * ```tsx
 * <Select 
 *   value={toSelectValue(data.status)}
 *   onValueChange={(val) => updateStatus(fromSelectValue(val))}
 * >
 *   {/* ... *\/}
 * </Select>
 * ```
 */
export function fromSelectValue(
  value: string,
  emptyValue: string = 'null'
): string | null {
  if (value === emptyValue) {
    return null;
  }
  return value;
}

/**
 * Type-safe boolean Select helpers
 * 
 * Convert between boolean/null and Select-safe string values
 */
export const booleanSelectHelpers = {
  /**
   * Convert boolean to Select value
   * @example toValue(true) => "true", toValue(null) => "null"
   */
  toValue: (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return 'null';
    return value ? 'true' : 'false';
  },

  /**
   * Convert Select value to boolean
   * @example fromValue("true") => true, fromValue("null") => null
   */
  fromValue: (value: string): boolean | null => {
    if (value === 'null') return null;
    return value === 'true';
  },

  /**
   * Standard options for yes/no/unknown selects
   */
  options: [
    { value: 'null', label: 'Unknown' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ] as const,
};

/**
 * Development-only hook to validate Select component usage
 * 
 * @example
 * ```tsx
 * function MySelect() {
 *   useSelectValidation(['option1', 'option2', ''], 'MySelect');
 *   // Will throw error in development if empty string found
 *   
 *   return (
 *     <Select>...</Select>
 *   );
 * }
 * ```
 */
export function useSelectValidation(
  values: (string | number | undefined | null)[],
  componentName?: string
): void {
  if (process.env.NODE_ENV === 'development') {
    // Only run validation once on mount
    React.useEffect(() => {
      validateSelectItems(values, componentName);
    }, []); // Empty deps = run once
  }
}

// Re-export React for the hook
import React from 'react';

/**
 * Common placeholder texts for consistency
 */
export const SELECT_PLACEHOLDERS = {
  OPTIONAL: 'Select an option (optional)',
  REQUIRED: 'Select an option',
  CHOOSE: 'Choose...',
  SELECT: 'Select...',
  NONE: 'None',
  ALL: 'All',
} as const;

/**
 * Validates Select component props in TypeScript
 * 
 * This type helper ensures your Select values are never empty strings
 */
export type ValidSelectValue = Exclude<string | number, ''>;

/**
 * Type guard to check if a value is valid for Select
 */
export function isValidSelectValue(value: unknown): value is ValidSelectValue {
  if (typeof value === 'string') {
    return value !== '';
  }
  return typeof value === 'number';
}

/**
 * Assertion function for Select values
 * Throws in development if value is invalid
 */
export function assertValidSelectValue(
  value: unknown,
  componentName?: string
): asserts value is ValidSelectValue {
  if (!isValidSelectValue(value)) {
    const location = componentName ? ` in ${componentName}` : '';
    throw new Error(
      `Invalid Select value${location}: ${JSON.stringify(value)}. ` +
      `SelectItem values must be non-empty strings or numbers.`
    );
  }
}
