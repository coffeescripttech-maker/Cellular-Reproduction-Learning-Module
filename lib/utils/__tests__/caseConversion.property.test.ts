/**
 * Property-Based Tests for Case Conversion Utilities
 * 
 * These tests validate universal properties that should hold across all inputs.
 * 
 * Feature: student-pages-api-migration
 * Property 10: Data Transformation Reversibility
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * NOTE: This test file requires fast-check to be installed:
 * npm install --save-dev fast-check @types/jest jest ts-jest
 * 
 * To run these tests:
 * npm test -- caseConversion.property.test.ts
 */

import fc from 'fast-check';
import { toSnakeCase, toCamelCase } from '../caseConversion';

describe('Property-Based Tests: Case Conversion Utilities', () => {
  /**
   * Property 10: Data Transformation Reversibility
   * 
   * For any object with camelCase fields, converting to snake_case and then
   * back to camelCase SHALL produce an equivalent object.
   */
  describe('Property 10: Data Transformation Reversibility', () => {
    it('should convert camelCase to snake_case and back to camelCase (identity)', () => {
      fc.assert(
        fc.property(
          fc.record({
            firstName: fc.string(),
            lastName: fc.string(),
            emailAddress: fc.emailAddress(),
            phoneNumber: fc.string(),
            isActive: fc.boolean(),
            accountBalance: fc.float(),
            userId: fc.uuid(),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should convert snake_case to camelCase and back to snake_case (identity)', () => {
      fc.assert(
        fc.property(
          fc.record({
            first_name: fc.string(),
            last_name: fc.string(),
            email_address: fc.emailAddress(),
            phone_number: fc.string(),
            is_active: fc.boolean(),
            account_balance: fc.float(),
            user_id: fc.uuid(),
          }),
          (obj) => {
            const camelCase = toCamelCase(obj);
            const backToSnake = toSnakeCase(camelCase);
            expect(backToSnake).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle nested objects correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            userProfile: fc.record({
              firstName: fc.string(),
              lastName: fc.string(),
              contactInfo: fc.record({
                emailAddress: fc.emailAddress(),
                phoneNumber: fc.string(),
              }),
            }),
            accountSettings: fc.record({
              isActive: fc.boolean(),
              notificationPreferences: fc.record({
                emailEnabled: fc.boolean(),
                smsEnabled: fc.boolean(),
              }),
            }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle arrays of objects correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            moduleList: fc.array(
              fc.record({
                moduleId: fc.uuid(),
                moduleName: fc.string(),
                progressPercentage: fc.integer({ min: 0, max: 100 }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle arrays of primitives correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            tags: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
            scores: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null and undefined values correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            optionalField: fc.option(fc.string(), { nil: null }),
            anotherOptional: fc.option(fc.integer(), { nil: undefined }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deeply nested structures correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            level1: fc.record({
              level2: fc.record({
                level3: fc.record({
                  deepValue: fc.string(),
                  deepArray: fc.array(
                    fc.record({
                      itemName: fc.string(),
                      itemValue: fc.integer(),
                    })
                  ),
                }),
              }),
            }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test that toSnakeCase converts all camelCase fields
   */
  describe('toSnakeCase conversion', () => {
    it('should convert all camelCase fields to snake_case', () => {
      fc.assert(
        fc.property(
          fc.record({
            firstName: fc.string(),
            lastName: fc.string(),
            emailAddress: fc.emailAddress(),
          }),
          (obj) => {
            const result = toSnakeCase(obj);
            expect(result).toHaveProperty('first_name');
            expect(result).toHaveProperty('last_name');
            expect(result).toHaveProperty('email_address');
            expect(result).not.toHaveProperty('firstName');
            expect(result).not.toHaveProperty('lastName');
            expect(result).not.toHaveProperty('emailAddress');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve values during conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            userName: fc.string(),
            userAge: fc.integer({ min: 0, max: 120 }),
          }),
          (obj) => {
            const result = toSnakeCase(obj);
            expect(result.user_id).toBe(obj.userId);
            expect(result.user_name).toBe(obj.userName);
            expect(result.user_age).toBe(obj.userAge);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test that toCamelCase converts all snake_case fields
   */
  describe('toCamelCase conversion', () => {
    it('should convert all snake_case fields to camelCase', () => {
      fc.assert(
        fc.property(
          fc.record({
            first_name: fc.string(),
            last_name: fc.string(),
            email_address: fc.emailAddress(),
          }),
          (obj) => {
            const result = toCamelCase(obj);
            expect(result).toHaveProperty('firstName');
            expect(result).toHaveProperty('lastName');
            expect(result).toHaveProperty('emailAddress');
            expect(result).not.toHaveProperty('first_name');
            expect(result).not.toHaveProperty('last_name');
            expect(result).not.toHaveProperty('email_address');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve values during conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            user_id: fc.uuid(),
            user_name: fc.string(),
            user_age: fc.integer({ min: 0, max: 120 }),
          }),
          (obj) => {
            const result = toCamelCase(obj);
            expect(result.userId).toBe(obj.user_id);
            expect(result.userName).toBe(obj.user_name);
            expect(result.userAge).toBe(obj.user_age);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test edge cases
   */
  describe('Edge cases', () => {
    it('should handle empty objects', () => {
      const empty = {};
      expect(toSnakeCase(empty)).toEqual({});
      expect(toCamelCase(empty)).toEqual({});
    });

    it('should handle null values', () => {
      expect(toSnakeCase(null)).toBeNull();
      expect(toCamelCase(null)).toBeNull();
    });

    it('should handle undefined values', () => {
      expect(toSnakeCase(undefined)).toBeUndefined();
      expect(toCamelCase(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(toSnakeCase('string')).toBe('string');
      expect(toSnakeCase(123)).toBe(123);
      expect(toSnakeCase(true)).toBe(true);
      expect(toCamelCase('string')).toBe('string');
      expect(toCamelCase(123)).toBe(123);
      expect(toCamelCase(true)).toBe(true);
    });

    it('should handle empty arrays', () => {
      expect(toSnakeCase([])).toEqual([]);
      expect(toCamelCase([])).toEqual([]);
    });
  });
});
