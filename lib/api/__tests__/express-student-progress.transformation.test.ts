/**
 * Property-Based Tests for Data Transformation
 * 
 * These tests validate that data transformation between camelCase and snake_case
 * is reversible and maintains data integrity.
 * 
 * NOTE: This test file requires fast-check to be installed:
 * npm install --save-dev fast-check @types/jest jest ts-jest
 * 
 * To run these tests:
 * npm test -- express-student-progress.transformation.test.ts
 */

import fc from 'fast-check';
import { toSnakeCase, toCamelCase } from '../../utils/caseConversion';

describe('Property-Based Tests: Data Transformation', () => {
  /**
   * Property 10: Data Transformation Reversibility
   * Feature: student-pages-api-migration
   * Validates: Requirements 12.1, 12.2
   * 
   * For any object with camelCase fields, converting to snake_case and then
   * back to camelCase SHALL produce an equivalent object.
   */
  describe('Property 10: Data Transformation Reversibility', () => {
    it('should be reversible for simple objects', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            firstName: fc.string(),
            lastName: fc.string(),
            emailAddress: fc.emailAddress(),
            phoneNumber: fc.string(),
            isActive: fc.boolean(),
            accountBalance: fc.float(),
            itemCount: fc.integer(),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify all fields match
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be reversible for nested objects', async () => {
      await fc.assert(
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
            
            // Verify nested structure is preserved
            expect(backToCamel).toEqual(obj);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be reversible for arrays of objects', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              studentId: fc.uuid(),
              moduleId: fc.uuid(),
              progressPercentage: fc.integer({ min: 0, max: 100 }),
              timeSpentMinutes: fc.integer({ min: 0, max: 10000 }),
              completedSections: fc.array(fc.string()),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (arr) => {
            const snakeCase = toSnakeCase(arr);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify array structure and contents are preserved
            expect(backToCamel).toEqual(arr);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle progress data transformation correctly', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            moduleId: fc.uuid(),
            status: fc.constantFrom('not_started', 'in_progress', 'completed', 'paused'),
            progressPercentage: fc.integer({ min: 0, max: 100 }),
            currentSectionId: fc.option(fc.uuid(), { nil: undefined }),
            timeSpentMinutes: fc.integer({ min: 0, max: 10000 }),
            completedSections: fc.option(fc.array(fc.string()), { nil: undefined }),
            assessmentScores: fc.option(
              fc.dictionary(fc.string(), fc.float({ min: 0, max: 100 })),
              { nil: undefined }
            ),
          }),
          (progressData) => {
            const snakeCase = toSnakeCase(progressData);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify all progress fields are preserved
            expect(backToCamel).toEqual(progressData);
            
            // Verify specific field transformations
            if (progressData.currentSectionId !== undefined) {
              expect(backToCamel.currentSectionId).toBe(progressData.currentSectionId);
            }
            if (progressData.completedSections !== undefined) {
              expect(backToCamel.completedSections).toEqual(progressData.completedSections);
            }
            if (progressData.assessmentScores !== undefined) {
              expect(backToCamel.assessmentScores).toEqual(progressData.assessmentScores);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve primitive types during transformation', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            stringValue: fc.string(),
            numberValue: fc.float(),
            integerValue: fc.integer(),
            booleanValue: fc.boolean(),
            nullValue: fc.constant(null),
            undefinedValue: fc.constant(undefined),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify primitive types are preserved
            expect(typeof backToCamel.stringValue).toBe('string');
            expect(typeof backToCamel.numberValue).toBe('number');
            expect(typeof backToCamel.integerValue).toBe('number');
            expect(typeof backToCamel.booleanValue).toBe('boolean');
            expect(backToCamel.nullValue).toBeNull();
            expect(backToCamel.undefinedValue).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty objects and arrays', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            emptyObject: fc.constant({}),
            emptyArray: fc.constant([]),
            nestedEmpty: fc.record({
              innerEmpty: fc.constant({}),
              innerArray: fc.constant([]),
            }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify empty structures are preserved
            expect(backToCamel).toEqual(obj);
            expect(backToCamel.emptyObject).toEqual({});
            expect(backToCamel.emptyArray).toEqual([]);
            expect(backToCamel.nestedEmpty.innerEmpty).toEqual({});
            expect(backToCamel.nestedEmpty.innerArray).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed case field names correctly', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            simpleField: fc.string(),
            twoWordField: fc.string(),
            threeWordFieldName: fc.string(),
            veryLongFieldNameWithManyWords: fc.string(),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify field names are correctly transformed
            expect(backToCamel).toEqual(obj);
            
            // Verify snake_case intermediate format
            expect(snakeCase).toHaveProperty('simple_field');
            expect(snakeCase).toHaveProperty('two_word_field');
            expect(snakeCase).toHaveProperty('three_word_field_name');
            expect(snakeCase).toHaveProperty('very_long_field_name_with_many_words');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Date objects without transformation', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            createdAt: fc.date(),
            updatedAt: fc.date(),
            metadata: fc.record({
              lastAccessedAt: fc.date(),
            }),
          }),
          (obj) => {
            const snakeCase = toSnakeCase(obj);
            const backToCamel = toCamelCase(snakeCase);
            
            // Verify Date objects are preserved
            expect(backToCamel.createdAt).toEqual(obj.createdAt);
            expect(backToCamel.updatedAt).toEqual(obj.updatedAt);
            expect(backToCamel.metadata.lastAccessedAt).toEqual(obj.metadata.lastAccessedAt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const obj = { firstName: null, lastName: null };
      const snakeCase = toSnakeCase(obj);
      const backToCamel = toCamelCase(snakeCase);
      
      expect(backToCamel).toEqual(obj);
    });

    it('should handle undefined values', () => {
      const obj = { firstName: undefined, lastName: 'Doe' };
      const snakeCase = toSnakeCase(obj);
      const backToCamel = toCamelCase(snakeCase);
      
      expect(backToCamel).toEqual(obj);
    });

    it('should handle deeply nested structures', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                deepValue: 'test',
              },
            },
          },
        },
      };
      
      const snakeCase = toSnakeCase(obj);
      const backToCamel = toCamelCase(snakeCase);
      
      expect(backToCamel).toEqual(obj);
    });

    it('should handle arrays with mixed types', () => {
      const obj = {
        mixedArray: [
          'string',
          123,
          true,
          null,
          { nestedObject: 'value' },
          ['nested', 'array'],
        ],
      };
      
      const snakeCase = toSnakeCase(obj);
      const backToCamel = toCamelCase(snakeCase);
      
      expect(backToCamel).toEqual(obj);
    });
  });
});
