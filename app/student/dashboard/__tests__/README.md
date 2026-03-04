# Student Dashboard Integration Tests

## Overview

Integration tests for the Student Dashboard page have been created to validate:
- Dashboard loads with mock data
- Refresh button updates data
- Error handling displays error message
- Loading states show correctly

**Requirements Validated:** 1.1, 1.2, 1.3, 1.4, 1.5

## Test Setup Required

Before running these tests, you need to install the testing framework and dependencies.

### 1. Install Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 2. Create Jest Configuration

Create a `jest.config.js` file in the root directory:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

### 3. Create Jest Setup File

Create a `jest.setup.js` file in the root directory:

```javascript
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
```

### 4. Add Test Script to package.json

Add the following to your `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running the Tests

Once the setup is complete, you can run the tests:

```bash
# Run all tests
npm test

# Run only dashboard tests
npm test -- page.integration.test.tsx

# Run tests in watch mode
npm test:watch

# Run with coverage
npm test:coverage
```

## Test Coverage

The integration tests cover:

### Dashboard Loading (Requirements 1.1, 1.2, 1.3, 1.4, 14.1)
- ✅ Display loading spinner initially
- ✅ Load dashboard with mock data
- ✅ Display user learning style information
- ✅ Verify all API calls are made

### Recent Activities (Requirements 1.4, 10.1, 10.2, 14.1)
- ✅ Display recent activities with scores and progress
- ✅ Display empty state when no activities
- ✅ Show activity timestamps and status

### Refresh Functionality (Requirements 1.1, 14.2, 14.4)
- ✅ Refresh dashboard data when button clicked
- ✅ Show refreshing indicator during refresh
- ✅ Display success toast after refresh
- ✅ Disable button during refresh

### Error Handling (Requirements 1.5, 13.1, 13.2, 13.4, 13.5)
- ✅ Display error message when data fails to load
- ✅ Allow retry after error
- ✅ Handle partial data load failures gracefully
- ✅ Show error toast notification

### Loading States (Requirements 14.1, 14.4)
- ✅ Show loading state correctly
- ✅ Hide loading state after data loads
- ✅ Display loading spinner

### Enrolled Classes (Requirements 7.1, 7.2, 7.4)
- ✅ Display enrolled classes when available
- ✅ Hide classes section when no classes enrolled

## Test Structure

Each test follows this structure:

```typescript
it('should [expected behavior]', async () => {
  /**
   * Feature: student-pages-api-migration
   * Test: [Test description]
   * Validates: Requirements X.Y, X.Z
   */
  
  // Test implementation
});
```

## Mocking Strategy

The tests mock the following dependencies:
- `useAuth` hook - provides mock user data
- `UnifiedStudentDashboardAPI` - mocks all dashboard API calls
- `VARKModulesAPI` - mocks module data
- `ClassesAPI` - mocks class data
- `sonner` toast - mocks toast notifications
- `CompletionDashboard` component - mocks the completion dashboard

## Notes

- Tests use React Testing Library for component testing
- All async operations use `waitFor` for proper timing
- Mocks are reset before each test with `beforeEach`
- Tests validate both success and error scenarios
- Loading states and user feedback are thoroughly tested

## Troubleshooting

If tests fail to run:

1. **Module resolution errors**: Ensure `moduleNameMapper` in jest.config.js matches your tsconfig paths
2. **Import errors**: Check that all dependencies are installed
3. **Timeout errors**: Increase Jest timeout in jest.config.js: `testTimeout: 10000`
4. **Mock errors**: Verify all mocked modules exist and exports match

## Future Enhancements

Potential additions to the test suite:
- E2E tests with Playwright or Cypress
- Visual regression tests
- Performance tests for dashboard load time
- Accessibility tests with jest-axe
