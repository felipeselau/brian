# Brian Test Infrastructure

Complete test setup for the Brian freelance board system.

## Structure

```
src/__tests__/
├── setup/
│   ├── vitest.setup.ts    # Global test setup
│   ├── test-db.ts         # Database utilities
│   ├── fixtures.ts        # Test data constants
│   └── mocks.ts           # R2, Resend, MSW mocks
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests (Playwright)
```

## Quick Start

### Run Tests

```bash
npm run test              # Unit + integration tests
npm run test:watch        # Watch mode
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright e2e tests
```

### Database Setup

```bash
npm run test:db:start     # Start Docker test database
npm run test:db:migrate   # Run migrations
npm run test:db:seed      # Seed test data
npm run test:db:stop      # Stop Docker container
npm run test:db:reset     # Reset database
```

## Test Database

- **URL**: `postgresql://test:test@localhost:5433/brian_test`
- **Auto-reset**: Database is reset before each test
- **Seed data**: 6 users, 3 projects, 15 tickets, labels, comments, etc.

### Test Users

| Email             | Role   | Password    |
| ----------------- | ------ | ----------- |
| alice@brian.dev   | OWNER  | password123 |
| bob@brian.dev     | WORKER | password123 |
| charlie@brian.dev | WORKER | password123 |
| diana@brian.dev   | CLIENT | password123 |
| eve@brian.dev     | CLIENT | password123 |
| frank@brian.dev   | OWNER  | password123 |

### Test Projects

- **Project Alpha** (active, alice) - 11 tickets, flexible settings
- **Project Beta** (archived, alice) - 1 archived ticket
- **Project Gamma** (active, frank) - 4 tickets, strict estimates required

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { prismaTest, seedTestData } from "@/__tests__/setup/test-db";
import { USERS } from "@/__tests__/setup/fixtures";

describe("User Model", () => {
  it("should create a user", async () => {
    const data = await seedTestData();
    const user = await prismaTest.user.findUnique({
      where: { email: USERS.ALICE.email },
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe("OWNER");
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from "vitest";
import { prismaTest, seedTestData } from "@/__tests__/setup/test-db";
import { POST } from "@/app/api/projects/route";
import { mockAuthSession } from "@/__tests__/setup/mocks";

describe("POST /api/projects", () => {
  it("should create a project", async () => {
    const data = await seedTestData();
    const session = mockAuthSession(data.users.alice.id, "OWNER");

    const request = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New Project",
        description: "Test project",
        startDate: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("user can login and view projects", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "alice@brian.dev");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("text=Project Alpha")).toBeVisible();
});
```

## Fixtures

All test data constants are exported from `fixtures.ts`:

```typescript
import { USERS, PROJECTS, TICKETS, LABELS } from "@/__tests__/setup/fixtures";

const aliceEmail = USERS.ALICE.email; // 'alice@brian.dev'
const alphaProject = PROJECTS.ALPHA; // { title: 'Project Alpha', ... }
```

## Mocks

### R2 Storage Mock

```typescript
import { mockR2 } from "@/__tests__/setup/mocks";

// Automatically mocked - no setup needed
await uploadFile(file); // Uses mock implementation
expect(mockR2.uploadFile).toHaveBeenCalled();
```

### Email Mock (Resend)

```typescript
import { mockResend } from "@/__tests__/setup/mocks";

// Automatically mocked
await sendInviteEmail(email);
expect(mockResend.emails.send).toHaveBeenCalledWith({
  to: email,
  subject: expect.any(String),
  html: expect.any(String),
});
```

### MSW (Network Mocking)

```typescript
import { setupMocks, server } from "@/__tests__/setup/mocks";

describe("API Tests", () => {
  setupMocks(); // Add this to enable MSW

  it("works with mocked network", async () => {
    // All HTTP requests are intercepted by MSW handlers
  });
});
```

## Utilities

### mockAuthSession

```typescript
import { mockAuthSession } from "@/__tests__/setup/mocks";

const session = mockAuthSession("user-id", "OWNER");
// { user: { id: 'user-id', role: 'OWNER', ... }, expires: '...' }
```

### mockFile

```typescript
import { mockFile } from "@/__tests__/setup/mocks";

const file = mockFile("test.png", "image/png", 1024);
```

### mockFormData

```typescript
import { mockFormData } from "@/__tests__/setup/mocks";

const formData = mockFormData({
  title: "Test",
  file: mockFile(),
});
```

## CI/CD Integration

Tests run automatically via Git hooks:

- **pre-commit**: Linting + formatting
- **pre-push**: Full test suite + type checking

GitHub Actions workflow runs:

- Unit tests
- Integration tests
- E2E tests (headless)
- Coverage reporting

## Coverage

Run `npm run test:coverage` to generate coverage reports:

```bash
npm run test:coverage
open coverage/index.html
```

Target coverage: **80%** minimum

## Troubleshooting

### Database Connection Issues

```bash
# Check if Docker is running
docker ps

# Restart database
npm run test:db:stop
npm run test:db:start
npm run test:db:migrate
```

### Prisma Client Out of Sync

```bash
npx prisma generate
```

### Clear Test Cache

```bash
rm -rf node_modules/.vitest
npm run test
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use fixtures** - Import constants from `fixtures.ts`
3. **Reset database** - Automatic between tests
4. **Mock external services** - R2, Resend, etc.
5. **Test user permissions** - Verify role-based access
6. **Test business rules** - Estimates, approvals, lifecycle
7. **Descriptive names** - `it('should allow OWNER to delete project')`
8. **Arrange-Act-Assert** - Clear test structure
