/**
 * Case Conversion Utilities
 * 
 * Provides functions to convert between camelCase and snake_case formats.
 * Handles nested objects and arrays recursively.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

/**
 * Converts a camelCase string to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts a snake_case string to camelCase
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the string
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts an object's keys from camelCase to snake_case recursively
 * @param obj - The object to convert (can be object, array, or primitive)
 * @returns A new object with snake_case keys
 */
export function toSnakeCase(obj: any): any {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  // Handle objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  // Handle primitives (string, number, boolean, etc.)
  return obj;
}

/**
 * Converts an object's keys from snake_case to camelCase recursively
 * @param obj - The object to convert (can be object, array, or primitive)
 * @returns A new object with camelCase keys
 */
export function toCamelCase(obj: any): any {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  // Handle objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  // Handle primitives (string, number, boolean, etc.)
  return obj;
}
