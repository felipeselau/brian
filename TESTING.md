# Testing Documentation

This document describes the testing infrastructure for the Brian project.

## Overview

Brian uses a comprehensive testing strategy with multiple layers:

| Layer       | Tool                     | Purpose                                 |
| ----------- | ------------------------ | --------------------------------------- |
| Unit        | Vitest                   | Test individual functions and utilities |
| Integration | Vitest + Prisma          | Test API routes with real database      |
| Component   | Vitest + Testing Library | Test React components in isolation      |
| E2E         | Playwright               | Test full user flows in browser         |

## Quick Start

### Run All Tests

```bash
# Run all tests once
npm test -- --run

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Run Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests (requires Docker)
npm run test:integration

# Component tests
npm run test:components

# E2E tests (requires app running)
npx playwright test
```

## Test Database Setup

Integration tests require a PostgreSQL database. Use Docker:

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Verify it's running
docker compose -f docker-compose.test.yml ps

# Stop test database
docker compose -f docker-compose.test.yml down
```

The database is automatically reset and seeded before each integration test suite.

## Test Structure

```
src/__tests__/
├── setup/
│   ├── vitest.setup.ts      # Global test setup
│   ├── test-db.ts           # Database reset/seed utilities
│   ├── fixtures.ts          # Test data constants
│   ├── mocks.ts             # Mock utilities
│   └── auth-mock.ts         # Session mocking
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── permissions.test.ts
│   │   └── validations/     # Zod schema tests
│   └── infrastructure.test.ts
├── integration/
│   └── api/
│       ├── auth/
│       ├── projects/
│       └── tickets/
└── components/
    ├── auth/
    ├── projects/
    └── board/

e2e/
├── fixtures.ts              # E2E test helpers
├── auth.spec.ts
├── projects.spec.ts
├── tickets.spec.ts
├── board.spec.ts
├── comments.spec.ts
├── members.spec.ts
├── settings.spec.ts
└── navigation.spec.ts
```

## Writing Tests

### Unit Tests

Test pure functions and utilities:

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });
});
```

### Integration Tests

Test API routes with real database:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createMockRequest } from "@/__tests__/setup/mocks";
import { POST } from "@/app/api/projects/route";
import { resetDatabase, seedTestData } from "@/__tests__/setup/test-db";

describe("POST /api/projects", () => {
  beforeAll(async () => {
    await resetDatabase();
    await seedTestData();
  });

  it("creates a project", async () => {
    const req = createMockRequest("POST", { title: "New Project" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.project.title).toBe("New Project");
  });
});
```

### Component Tests

Test React components in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('LoginForm', () => {
  it('submits form with credentials', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert on behavior
  });
});
```

### E2E Tests

Test full user flows:

```typescript
import { test, expect, TEST_USERS } from "./fixtures";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USERS.ALICE.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.ALICE.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

## Test Fixtures

### Users

| User    | Role   | Email             |
| ------- | ------ | ----------------- |
| Alice   | OWNER  | alice@brian.dev   |
| Bob     | WORKER | bob@brian.dev     |
| Charlie | WORKER | charlie@brian.dev |
| Diana   | CLIENT | diana@brian.dev   |
| Eve     | CLIENT | eve@brian.dev     |
| Frank   | OWNER  | frank@brian.dev   |

All test users have password: `password123`

### Projects

| Project       | Status   | Settings                    |
| ------------- | -------- | --------------------------- |
| Project Alpha | ACTIVE   | Normal                      |
| Project Beta  | ARCHIVED | -                           |
| Project Gamma | ACTIVE   | Strict (estimates required) |

### Tickets

Various tickets in different states (BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED, WAITING).

## Mocking

### Mocking NextAuth Session

```typescript
import { mockSession } from "@/__tests__/setup/auth-mock";
import { USERS } from "@/__tests__/setup/fixtures";

// Mock authenticated request
const req = createMockRequest("POST", { data: "..." });
mockSession({ user: { id: "user-id", ...USERS.ALICE } });
```

### Mocking fetch

```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: "response" }),
});
```

### Skipping Database Reset

For component tests that don't need the database:

```bash
SKIP_DB_RESET=true npm run test:components
```

## Coverage

### Thresholds

Coverage must meet these minimums to pass CI:

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 70%       |
| Functions  | 75%       |
| Branches   | 60%       |
| Statements | 70%       |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens an interactive UI for running and debugging tests.

### Playwright Inspector

```bash
npx playwright test --debug
```

Opens tests with step-by-step debugging.

### Playwright Trace Viewer

```bash
npx playwright show-trace trace.zip
```

View traces from failed tests.

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Use realistic data** - Use fixtures that match production patterns
3. **Isolate tests** - Each test should be independent
4. **Mock at boundaries** - Mock external services, not internal functions
5. **Keep tests fast** - Use unit tests for logic, E2E for critical paths
6. **Name tests clearly** - Describe what behavior is being tested

## Troubleshooting

### "Connection refused" in integration tests

Make sure the test database is running:

```bash
docker compose -f docker-compose.test.yml up -d
```

### Tests hang or timeout

Check for:

- Unclosed database connections
- Pending promises not awaited
- Infinite loops in code

### E2E tests fail with "Target closed"

The app might have crashed. Check:

- Build errors: `npm run build`
- Server logs in terminal
- Port 3000 availability

### Coverage not reaching thresholds

1. Check which files are missing coverage
2. Add tests for untested functions
3. Consider if some code is dead and can be removed
