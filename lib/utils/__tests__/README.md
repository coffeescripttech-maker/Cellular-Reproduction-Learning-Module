# Case Conversion Utility Tests

## Overview

Property-based tests have been created for the case conversion utilities (`toSnakeCase` and `toCamelCase`), but the test framework needs to be installed before they can be run.

## Required Dependencies

Install the following dependencies in the root project:

```bash
npm install --save-dev jest @types/jest ts-jest fast-check @types/fast-check
```

## Jest Configuration

Create a `jest.config.js` file in the root directory if it doesn't exist:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/components', '<rootDir>/app'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
```

## Running Tests

Once the dependencies are installed, run tests with:

```bash
# Run all tests
npm test

# Run case conversion tests specifically
npm test -- caseConversion.property.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Files Created

1. `caseConversion.property.test.ts` - Property-based tests for case conversion utilities

## Property Tests Implemented

### Property 10: Data Transformation Reversibility

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

The tests validate that:
- camelCase → snake_case → camelCase is identity
- snake_case → camelCase → snake_case is identity
- Nested objects convert correctly
- Arrays of objects convert correctly
- Arrays of primitives convert correctly
- Null and undefined values are handled correctly
- Deeply nested structures convert correctly
- All camelCase fields are converted to snake_case
- All snake_case fields are converted to camelCase
- Values are preserved during conversion

## Test Coverage

- **100+ iterations per property test** (as specified in design document)
- Tests cover simple objects, nested objects, arrays, primitives, null/undefined
- Edge cases: empty objects, empty arrays, primitive values
- Value preservation validation
- Field name conversion validation

## Note

The tests are written and ready to run, but cannot be executed until the test framework is installed. The implementation follows the design document's testing strategy with 100+ iterations per property test.
