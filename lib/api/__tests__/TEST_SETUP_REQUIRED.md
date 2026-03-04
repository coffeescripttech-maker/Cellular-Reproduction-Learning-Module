# Test Setup Required

## Overview

Property-based tests have been created for the Student Progress API, but the test framework needs to be installed before they can be run.

## Required Dependencies

Install the following dependencies in the root project:

```bash
npm install --save-dev jest @types/jest ts-jest fast-check @types/fast-check
```

## Jest Configuration

Create a `jest.config.js` file in the root directory:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/components'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
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

# Run specific test file
npm test -- express-student-progress.property.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Files Created

1. `express-student-progress.property.test.ts` - Property-based tests for progress persistence and data transformation
2. `express-student-progress.transformation.test.ts` - Tests for camelCase/snake_case conversion

## Property Tests Implemented

### Property 3: Progress Persistence
- Validates that saved progress can be immediately fetched with the same percentage
- Tests progress percentage bounds (0-100)
- Validates: Requirements 3.4

### Property 10: Data Transformation Reversibility
- Validates that camelCase → snake_case → camelCase is identity
- Tests nested objects and arrays
- Validates: Requirements 12.1, 12.2

## Note

The tests are written and ready to run, but cannot be executed until the test framework is installed. The implementation follows the design document's testing strategy with 100+ iterations per property test.
