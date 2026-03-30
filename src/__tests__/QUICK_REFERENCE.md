# 🧪 Quick Test Reference

## Import Utilities

```typescript
// Database & Seeding
import { prismaTest, seedTestData, resetDatabase } from "@/__tests__/setup/test-db";

// Fixtures (Constants)
import { USERS, PROJECTS, TICKETS, LABELS, COMMENTS } from "@/__tests__/setup/fixtures";

// Mocks
import { mockR2, mockResend, mockAuthSession, mockFile } from "@/__tests__/setup/mocks";

// Test Framework
import { describe, it, expect, beforeEach, vi } from "vitest";
```

## Common Patterns

### Basic Unit Test

```typescript
describe("Feature Name", () => {
  it("should do something", async () => {
    const data = await seedTestData();

    const result = await doSomething(data.users.alice.id);

    expect(result).toBeDefined();
  });
});
```

### API Route Test

```typescript
import { POST } from "@/app/api/projects/route";

it("should create project", async () => {
  const data = await seedTestData();

  const req = new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test", startDate: new Date() }),
  });

  const res = await POST(req);
  expect(res.status).toBe(201);
});
```

### Permission Test

```typescript
it("should deny access to non-owner", async () => {
  const data = await seedTestData();

  // Bob (WORKER) tries to delete Alice's project
  const result = await deleteProject(data.projects.projectAlpha.id, data.users.bob.id);

  expect(result.error).toBe("Unauthorized");
});
```

## Test Users (Quick Reference)

```typescript
// OWNERS
const alice = data.users.alice; // Owns Alpha & Beta
const frank = data.users.frank; // Owns Gamma

// WORKERS
const bob = data.users.bob; // In Alpha & Gamma
const charlie = data.users.charlie; // In Alpha

// CLIENTS
const diana = data.users.diana; // In Alpha
const eve = data.users.eve; // In Gamma
```

## Assertions

```typescript
// Existence
expect(user).toBeDefined();
expect(user).not.toBeNull();

// Equality
expect(user.role).toBe("OWNER");
expect(project.status).toBe("ACTIVE");

// Counts
expect(tickets).toHaveLength(5);
expect(count).toBeGreaterThan(0);

// Objects
expect(project).toMatchObject({
  title: "Test",
  status: "ACTIVE",
});

// Arrays
expect(tickets).toContainEqual(
  expect.objectContaining({
    title: "Setup authentication",
  })
);

// Async
await expect(promise).resolves.toBeDefined();
await expect(promise).rejects.toThrow("Error");
```

## Database Queries

```typescript
// Find by email
const user = await prismaTest.user.findUnique({
  where: { email: USERS.ALICE.email },
});

// Find with relations
const project = await prismaTest.project.findUnique({
  where: { id: projectId },
  include: {
    owner: true,
    members: true,
    tickets: true,
  },
});

// Count
const count = await prismaTest.ticket.count({
  where: { status: "IN_PROGRESS" },
});

// Find many
const tickets = await prismaTest.ticket.findMany({
  where: { projectId, status: "BACKLOG" },
  orderBy: { position: "asc" },
});
```

## Mocking

```typescript
// Mock auth session
const session = mockAuthSession(userId, "OWNER");

// Mock file upload
const file = mockFile("test.png", "image/png", 1024);
await uploadFile(file);
expect(mockR2.uploadFile).toHaveBeenCalled();

// Mock email
await sendEmail(email);
expect(mockResend.emails.send).toHaveBeenCalledWith({
  to: expect.any(String),
  subject: expect.stringContaining("Invite"),
});

// Spy on function
const spy = vi.spyOn(service, "method");
await service.method();
expect(spy).toHaveBeenCalledTimes(1);
```

## Common Scenarios

### Test CRUD Operations

```typescript
describe("Project CRUD", () => {
  it("should create", async () => {
    /* ... */
  });
  it("should read", async () => {
    /* ... */
  });
  it("should update", async () => {
    /* ... */
  });
  it("should delete", async () => {
    /* ... */
  });
  it("should list", async () => {
    /* ... */
  });
});
```

### Test Business Rules

```typescript
it("should require estimate before moving to in_progress", async () => {
  const data = await seedTestData();
  const ticket = data.tickets.ticket8; // In Gamma (strict)

  const result = await updateTicketStatus(ticket.id, "IN_PROGRESS");

  expect(result.error).toMatch(/estimate required/i);
});
```

### Test Lifecycle

```typescript
it("should log status changes", async () => {
  const data = await seedTestData();

  await updateTicketStatus(ticket.id, "IN_PROGRESS", user.id);

  const updated = await prismaTest.ticket.findUnique({ where: { id: ticket.id } });
  const log = updated.lifecycleLog as any[];

  expect(log).toContainEqual(
    expect.objectContaining({
      from: "BACKLOG",
      to: "IN_PROGRESS",
      by: user.id,
    })
  );
});
```

## Tips

- ✅ Use `seedTestData()` in most tests
- ✅ Import constants from `fixtures.ts`
- ✅ Test permissions for each role
- ✅ Test edge cases (empty, null, invalid)
- ✅ Test business rules explicitly
- ✅ Use descriptive test names
- ✅ One assertion concept per test
- ✅ Arrange-Act-Assert pattern

## Running Tests

```bash
npm test                    # All tests
npm test -- --watch        # Watch mode
npm test -- path/to/test   # Single file
npm run test:coverage      # With coverage
```

## Debugging

```typescript
// Console log
console.log({ user, project });

// Vitest debug
import { test } from "vitest";
test.only("debug this", async () => {
  /* ... */
});

// Database inspection
const all = await prismaTest.user.findMany();
console.log("All users:", all);
```
