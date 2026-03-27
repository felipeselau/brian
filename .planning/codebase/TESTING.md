# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework Status

### No Test Framework Installed

The project currently has **no test runner configured**. This is a significant gap in the codebase quality.

**Package Manifest Evidence:**
- No Jest, Vitest, or testing library in `package.json`
- No `jest.config.*` or `vitest.config.*` files
- No test files found via glob patterns: `*.test.*`, `*.spec.*`

## Installed Quality Tools

### Linting
- **Config:** `.eslintrc.json` extends `next/core-web-vitals`
- **Version:** `eslint@8.57.0`, `eslint-config-next@14.2.5`
- **Run Command:** `npm run lint`

### Type Checking
- **Version:** `typescript@5.5.3`
- **Strict Mode:** Enabled in `tsconfig.json`
- **Run Command:** `npx tsc --noEmit`

### Build Validation
- **Command:** `npm run build`
- Uses Next.js build system

## Current Code Quality

### TypeScript Strict Mode
- `"strict": true` in `tsconfig.json`
- All type checking enforced
- No implicit `any` allowed

### ESLint Rules
- Next.js web vitals rules enforced
- Covers common React/Next.js issues
- No custom rules detected

### Prettier
- **Not configured** - no `.prettierrc` or `.prettierrc.json`
- No Prettier dependency in `package.json`

## Test Coverage Gaps

### What Is NOT Tested
Based on codebase exploration:

| Area | Status | Risk |
|------|--------|------|
| Zod Schemas | ❌ Not tested | Invalid data could break API |
| API Routes | ❌ Not tested | Integration errors uncaught |
| Components | ❌ Not tested | UI bugs not caught |
| Auth Logic | ❌ Not tested | Permission bypass possible |
| Prisma Queries | ❌ Not tested | Query errors uncaught |

### Critical Untested Files

| File | Purpose | Risk Level |
|------|---------|------------|
| `src/lib/auth.ts` | Authentication logic | HIGH |
| `src/lib/prisma.ts` | Database client | HIGH |
| `src/lib/validations/*.ts` | Input validation | HIGH |
| `src/app/api/**/*.ts` | All API routes | HIGH |
| `src/components/**/*.tsx` | UI components | MEDIUM |

## Testing Recommendations

### Immediate Needs

1. **Install Vitest** (Recommended over Jest for Next.js)
   ```bash
   npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Configuration Required**
   - Create `vitest.config.ts` with React plugin
   - Add test scripts to `package.json`
   - Create test setup file (`src/test/setup.ts`)

3. **Create Initial Tests**
   - Test Zod validation schemas
   - Test utility functions (`cn()` in utils.ts)
   - Test auth session handling

### Suggested Test Structure
```
src/
├── __tests__/
│   ├── lib/
│   │   ├── auth.test.ts
│   │   ├── prisma.test.ts
│   │   └── utils.test.ts
│   ├── validations/
│   │   ├── project.test.ts
│   │   └── request.test.ts
│   └── components/
│       ├── project-card.test.tsx
│       └── login-form.test.tsx
├── components/
├── lib/
└── types/
```

### Commands to Add to package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

## CI/CD Configuration

### Current State
- No CI/CD pipeline configured
- No GitHub Actions workflows found
- No pipeline validation

### What Should Be Added
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test:run --if-present
      - run: npm run build

  # Optional: Add Playwright for E2E
  e2e:
    runs: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npx playwright install
      - run: npx playwright test
```

## Code Coverage Goals

### Recommended Targets
| Type | Target | Priority |
|------|--------|----------|
| Utility functions | 90%+ | HIGH |
| Zod schemas | 80%+ | HIGH |
| API routes | 70%+ | MEDIUM |
| Components | 60%+ | MEDIUM |

### Coverage for Quality-Critical Files
- `src/lib/validations/*.ts` - Validation logic is critical
- `src/lib/auth.ts` - Security-critical authentication
- `src/app/api/**/*.ts` - All external-facing endpoints

## Quality Metrics

### Current State
| Metric | Status | Notes |
|--------|--------|-------|
| Lint | ✅ Passing | `npm run lint` |
| Types | ✅ Passing | `npx tsc --noEmit` |
| Build | ✅ Passing | `npm run build` |
| Tests | ❌ Missing | No test runner |
| Coverage | ❌ N/A | No tests to cover |

### Before Deploy Checklist
```bash
# Must pass before merge
npm run lint        # ESLint
npx tsc --noEmit   # TypeScript
npm run build      # Production build
# npm run test:run # (when tests added)
```

## Test Patterns (For Future Implementation)

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('utilityFunction', () => {
  it('should do something specific', () => {
    const result = utilityFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './component-name';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('expected')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### API Route Test Template
```typescript
import { HttpRequest } from '@msw/node';
import { setupServer } from 'msw/node';

const server = setupServer();

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  default: {
    project: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects', () => {
  it('should return projects for authenticated user', async () => {
    const response = await fetch('/api/projects');
    expect(response.status).toBe(200);
  });
});
```

---

*Testing analysis: 2026-03-26*