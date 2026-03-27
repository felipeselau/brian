# TESTING.md — Testing Practices

**Generated:** 2026-03-27
**Focus:** Testing structure and practices

## Current State

### No Test Framework Installed
The project currently has **no test framework** configured.

### Available Linting
- **ESLint** with `eslint-config-next`
- Run with: `npm run lint`

### Type Checking
- **TypeScript** strict mode enabled
- Run with: `npx tsc --noEmit`

## Testing Recommendations

### Should Be Added

1. **Vitest** or **Jest** for unit testing
2. **React Testing Library** for component testing
3. **Playwright** or **Cypress** for E2E testing

### Current Test Locations (if created)
Tests should go in:
```
__tests__/
├── components/
├── lib/
└── api/
```

### Test Patterns to Use

#### Unit Tests
- Test utility functions in `src/lib/`
- Test Zod validation schemas
- Test helper functions

#### Component Tests
- Test UI components with React Testing Library
- Test user interactions (clicks, form submits)
- Test component rendering with mock data

#### API Tests
- Test API route handlers
- Test with test database or mocks

### Suggested Commands (when tests added)

```bash
npm run test           # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run e2e           # Run E2E tests (if Playwright/Cypress)
```

### CI Integration (future)
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test

- name: Lint
  run: npm run lint

- name: Type check
  run: npx tsc --noEmit
```

## Immediate Quality Checks

Before committing, run locally:
```bash
npm run lint        # ESLint
npx tsc --noEmit   # TypeScript check
npm run build      # Production build
```

## Code Coverage Goals

- **Unit tests:** 80%+ coverage for `lib/`, `utils/`
- **Component tests:** Key UI components
- **E2E tests:** Critical user flows