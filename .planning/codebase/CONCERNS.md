# Codebase Concerns

**Analysis Date:** 2026-03-26

---

## 1. Security Concerns

### 1.1 CRITICAL: Broken API URL Placeholders (Active Bug)
**Severity:** CRITICAL
**Files:**
- `src/components/requests/comments-section.tsx` (lines 48, 75)
- `src/components/requests/attachments-section.tsx` (lines 48, 76)

**Issue:** Both components use hardcoded placeholder strings instead of the actual `projectId` in API URLs.

```tsx
// comments-section.tsx line 48 - BROKEN
const response = await fetch(`/api/projects/*-PLACEHOLDER-*/requests/${requestId}/comments`, { ... });

// comments-section.tsx line 75 - BROKEN
const response = await fetch(`/api/projects/*-PLACEHOLDER-*/requests/${requestId}/comments/${commentId}`, { ... });

// attachments-section.tsx line 48 - BROKEN
const response = await fetch(`/api/projects/PROJECT_ID_PLACEHOLDER/requests/${requestId}/attachments`, { ... });

// attachments-section.tsx line 76 - BROKEN
const response = await fetch(`/api/projects/PROJECT_ID_PLACEHOLDER/requests/${requestId}/attachments/${attachmentId}`, { ... });
```

**Impact:** All comment and attachment operations (create, delete) will fail with 404 or authorization errors. The UI is completely non-functional for these features.

**Fix approach:** Both components need `projectId` passed as a prop. `CommentsSection` already receives `requestId` but needs `projectId`. Add `projectId: string` to both component interfaces and use it in the API URLs.

---

### 1.2 CRITICAL: User Self-Registration as OWNER
**Severity:** CRITICAL
**File:** `src/app/api/auth/register/route.ts` (lines 10, 39)

**Issue:** The registration endpoint allows users to self-register with the `OWNER` role:
```ts
const registerSchema = z.object({
  // ...
  role: z.enum(["OWNER", "WORKER", "CLIENT"]).optional(), // Users can choose OWNER
});
// ...
role: role || "WORKER", // line 39
```

**Impact:** Any user can create an account with OWNER privileges, bypassing all business logic constraints (only owners can create projects, manage members, delete requests, approve work).

**Fix approach:** Remove the `role` field from the registration schema entirely, or hardcode it to `WORKER`. Owner promotion should require an admin action or separate privileged endpoint.

---

### 1.3 HIGH: No Rate Limiting on Auth Endpoints
**Severity:** HIGH
**Files:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`

**Issue:** No rate limiting on login or registration endpoints. The login endpoint uses bcrypt which provides some protection against brute force, but there's no application-level throttling.

**Impact:** Susceptible to credential stuffing, brute force attacks, and account enumeration via timing attacks.

**Fix approach:** Implement rate limiting middleware (e.g., `@upstash/ratelimit` or in-memory rate limiter) for auth endpoints.

---

### 1.4 HIGH: User Enumeration via Registration
**Severity:** HIGH
**File:** `src/app/api/auth/register/route.ts` (lines 23-27)

**Issue:** Registration returns distinct error messages:
```ts
if (existingUser) {
  return NextResponse.json(
    { error: "User already exists" }, // Distinct from generic error
    { status: 400 }
  );
}
```

**Impact:** Attackers can enumerate registered email addresses.

**Fix approach:** Return a generic "If the email is available, an account will be created" message regardless of whether the email exists.

---

### 1.5 MEDIUM: Middleware Excludes API Routes
**Severity:** MEDIUM
**File:** `src/middleware.ts` (line 26)

**Issue:** The middleware matcher explicitly excludes API routes:
```ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Impact:** While individual API routes check `auth()`, there's no centralized enforcement. If any API route forgets to check auth, it's completely unprotected. This is a defense-in-depth failure.

**Fix approach:** Either protect API routes in middleware too, or create a shared `requireAuth()` / `requireOwner()` utility that wraps API handlers.

---

### 1.6 MEDIUM: No CSRF Protection on API Routes
**Severity:** MEDIUM
**Files:** All API route files

**Issue:** POST, PATCH, DELETE endpoints accept requests without CSRF token validation. NextAuth v5 with JWT strategy doesn't automatically protect API routes.

**Impact:** Cross-site request forgery attacks could manipulate data if the user is authenticated.

**Fix approach:** Implement CSRF token validation or ensure all state-changing requests use `Content-Type: application/json` (which browsers won't send cross-origin without CORS preflight).

---

### 1.7 MEDIUM: Attachment URL Injection
**Severity:** MEDIUM
**File:** `src/app/api/projects/[projectId]/requests/[requestId]/attachments/route.ts` (lines 6-11)

**Issue:** The attachment URL is validated only as a valid URL string. There's no restriction on the URL scheme:
```ts
const createAttachmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"), // Accepts javascript:, data:, file: etc.
  // ...
});
```

**Impact:** Malicious URLs (e.g., `javascript:alert(document.cookie)`) could be stored and rendered in the UI as clickable links.

**Fix approach:** Add `.refine(url => url.startsWith('https://'))` or use a URL validator that only allows `http://` and `https://` schemes.

---

## 2. Performance Concerns

### 2.1 HIGH: No Pagination on Request Queries
**Severity:** HIGH
**Files:**
- `src/app/api/projects/[projectId]/requests/route.ts` (lines 60-99)
- `src/app/api/projects/[projectId]/board/route.ts` (lines 50-69)
- `src/app/(dashboard)/projects/[projectId]/page.tsx` (lines 58-70)

**Issue:** All request queries fetch ALL requests for a project without pagination:
```ts
const requests = await prisma.request.findMany({
  where: { projectId },
  // No skip/take - loads ALL requests
  include: { ... }
});
```

**Impact:** As projects accumulate hundreds or thousands of requests, these queries will become increasingly slow and consume excessive memory. The board view especially will degrade.

**Fix approach:** Implement cursor-based pagination for request lists. The board view should consider virtualization or lazy-loading columns.

---

### 2.2 HIGH: Excessive Nested Includes (Over-fetching)
**Severity:** HIGH
**Files:**
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (lines 29-89)
- `src/app/(dashboard)/projects/[projectId]/page.tsx` (lines 34-78)

**Issue:** The single request endpoint eagerly loads an enormous amount of data:
```ts
const request = await prisma.request.findUnique({
  where: { id: requestId },
  include: {
    project: { include: { owner: {...}, members: { include: { user: {...} } } } },
    assignedTo: {...},
    createdBy: {...},
    comments: { include: { user: {...} }, orderBy: {...} }, // ALL comments
    attachments: true, // ALL attachments
    _count: {...},
  },
});
```

**Impact:** Each request load fetches the entire project with all members, all comments, and all attachments. For requests with many comments/attachments, this becomes very slow.

**Fix approach:** Use `select` to limit fields. Paginate comments. Lazy-load attachments.

---

### 2.3 MEDIUM: Redundant Authorization Queries
**Severity:** MEDIUM
**Files:**
- `src/app/api/projects/[projectId]/requests/route.ts` (lines 37-58)
- `src/app/api/projects/[projectId]/requests/[requestId]/attachments/route.ts` (lines 27-48)
- `src/app/api/projects/[projectId]/requests/[requestId]/comments/route.ts` (lines 25-47)

**Issue:** Authorization checks frequently make separate database queries instead of using the data already fetched:
```ts
// First query: fetch project
const project = await prisma.project.findUnique({ where: { id: projectId } });
// Second query: check membership (can be combined)
const isMember = await prisma.projectMember.findUnique({
  where: { projectId_userId: { projectId, userId: session.user.id } },
});
```

**Impact:** Extra database round trips on every request. Could be 2-3x slower than necessary.

**Fix approach:** Include membership check in the project query using `include` or use a single query with a join.

---

### 2.4 MEDIUM: Duplicate Status Mapping Logic
**Severity:** MEDIUM
**Files:**
- `src/components/board/kanban-board.tsx` (lines 53-60, 89-96, 127-134)
- `src/app/(dashboard)/projects/[projectId]/board-wrapper.tsx` (lines 55-62)

**Issue:** The same `statusMap` object is defined 4 separate times across the codebase:
```tsx
const statusMap: Record<string, RequestStatus> = {
  BACKLOG: "BACKLOG",
  IN_PROGRESS: "IN_PROGRESS",
  // ... duplicated 4 times
};
```

**Impact:** If the status enum changes or new statuses are added, every copy must be updated. Maintenance burden and source of bugs.

**Fix approach:** Extract to a shared utility in `src/lib/status.ts` and import everywhere.

---

### 2.5 LOW: No Image Optimization
**Severity:** LOW
**Files:**
- `src/components/requests/comments-section.tsx` (line 115)
- `src/components/projects/project-settings.tsx` (line 216)

**Issue:** Avatar images are rendered with standard `<img>` tags via the Avatar component instead of Next.js `<Image>` component.

**Impact:** Missing automatic image optimization, lazy loading, and responsive sizing.

**Fix approach:** Ensure Avatar components use `next/image` when displaying user-uploaded images.

---

## 3. Scalability Concerns

### 3.1 HIGH: Unbounded JSON Fields
**Severity:** HIGH
**File:** `prisma/schema.prisma` (lines 120-121)

**Issue:** The `lifecycleLog` JSON field grows unboundedly. Every status change appends a new entry:
```prisma
lifecycleLog   Json          // Array: [{ from, to, by, at }]
```

The API appends entries at `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (line 154):
```ts
const lifecycleLog = existingRequest.lifecycleLog as any[] || [];
lifecycleLog.push({ from: existingRequest.status, to: newStatus, ... });
```

**Impact:** For long-running requests with many status changes, this JSON field could grow to megabytes. The entire array is read and written on every update. PostgreSQL has a practical limit of ~1GB per JSONB field.

**Fix approach:** Move lifecycle log to a separate `RequestLifecycleEntry` table with proper indexing. Or implement log rotation (keep last N entries).

---

### 3.2 MEDIUM: Hard Cascade Deletes
**Severity:** MEDIUM
**File:** `prisma/schema.prisma` (lines 69, 86-87, 108, 114)

**Issue:** Deleting a project cascades to delete ALL related data:
```prisma
owner       User          @relation("ProjectOwner", ..., onDelete: Cascade)
project     Project       @relation(fields: [projectId], ..., onDelete: Cascade)
```

**Impact:** Accidental project deletion permanently destroys all requests, comments, attachments, and members. No soft-delete, no recovery, no audit trail.

**Fix approach:** Implement soft-delete with `deletedAt` timestamps. Or at minimum, add confirmation requirements and backup capabilities before deletion.

---

### 3.3 MEDIUM: No Real-time Updates
**Severity:** MEDIUM
**Files:** All components and API routes

**Issue:** The board and request pages use `router.refresh()` for data updates. There's no WebSocket, SSE, or polling mechanism for real-time collaboration.

**Impact:** When multiple users work on the same board simultaneously, they'll see stale data. Drag-and-drop changes from one user won't appear for others until manual refresh.

**Fix approach:** Implement polling (`setInterval` + `router.refresh()`) as MVP, or add WebSocket/SSE for true real-time updates.

---

### 3.4 LOW: No Database Connection Pooling Configuration
**Severity:** LOW
**File:** `src/lib/prisma.ts`

**Issue:** The Prisma client uses default connection pool settings. On Vercel (serverless), each function invocation may create new connections.

**Impact:** Under load, could exhaust PostgreSQL connection limits. Vercel recommends specific Prisma configuration for serverless environments.

**Fix approach:** Add `?connection_limit=1` to the DATABASE_URL or configure Prisma's connection pool for serverless deployment.

---

## 4. Code Quality Issues

### 4.1 HIGH: Duplicate Zod Schemas
**Severity:** HIGH
**Files:**
- `src/app/api/projects/[projectId]/requests/route.ts` (lines 6-21)
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (lines 6-13)

**Issue:** The `updateRequestSchema` is defined identically in two different files:
```ts
// requests/route.ts
const updateRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  loggedHours: z.number().optional(),
});
// Same schema repeated in [requestId]/route.ts
```

**Impact:** If validation rules change, both copies must be updated. Already shows signs of drift (one file defines `createRequestSchema` and `updateRequestSchema`, the other only `updateRequestSchema`).

**Fix approach:** Move all request schemas to `src/lib/validations/request.ts` following the existing pattern for projects.

---

### 4.2 MEDIUM: Weak Status Validation
**Severity:** MEDIUM
**Files:**
- `src/app/api/projects/[projectId]/requests/route.ts` (lines 9, 151)
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (line 9)
- `src/app/api/projects/[projectId]/board/route.ts` (line 8)

**Issue:** Status fields are validated as generic strings instead of using the Prisma `RequestStatus` enum:
```ts
status: z.string().optional(), // Accepts ANY string
// ...
const status = validatedData.status?.toUpperCase() || "BACKLOG";
updateData.status = newStatus.toUpperCase(); // No enum check
```

**Impact:** Invalid status values can be written to the database, causing application errors when comparing against expected enum values.

**Fix approach:** Use `z.nativeEnum(RequestStatus)` or `z.enum(["BACKLOG", "IN_PROGRESS", ...])` for all status validations.

---

### 4.3 MEDIUM: Excessive `as any` Type Casting
**Severity:** MEDIUM
**Files:** Multiple component files

**Issue:** Heavy use of `as any` casts to bypass TypeScript:
```tsx
// project page (line 123)
columns={(project.columns as any) || []}
requests={(project.requests as any) || []}

// request page (line 163)
request={request as any}

// auth.ts (line 9)
adapter: PrismaAdapter(prisma) as any
```

**Impact:** Loss of type safety. If the data shape changes, no compile-time errors will catch mismatches. Runtime crashes become more likely.

**Fix approach:** Define proper types that match the actual Prisma query results. Use `satisfies` operator where helpful.

---

### 4.4 MEDIUM: Lifecycle Log Schema Mismatch
**Severity:** MEDIUM
**Files:**
- `prisma/schema.prisma` (line 83 comment)
- `src/types/index.ts` (lines 46-53)
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (lines 160-165)

**Issue:** The AGENTS.md and schema comment define the lifecycle log structure as:
```
[{ from: string, to: string, by: string, at: string }]
```

But the TypeScript interface includes extra fields:
```ts
interface LifecycleLogEntry {
  action: string;      // Not in schema comment
  metadata?: Record<string, any>; // Not in schema comment
}
```

And the API creates entries with different field names:
```ts
lifecycleLog.push({
  from: existingRequest.status,
  to: newStatus,
  by: session.user.id,
  at: new Date().toISOString(),
  // No 'action' field in normal updates
});
```

While the approval route adds `action`:
```ts
lifecycleLog.push({
  // ...
  action: `approved_${type}`, // Only sometimes present
});
```

**Impact:** Inconsistent data structure makes it impossible to reliably parse or display lifecycle logs.

**Fix approach:** Standardize the lifecycle log entry format. Either always include `action` or remove it from the interface.

---

### 4.5 MEDIUM: Member Search Uses Partial Email Match
**Severity:** MEDIUM
**File:** `src/app/api/users/route.ts` (lines 22-27)

**Issue:** The user search endpoint uses `contains` for email matching:
```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: email, // Partial match - "a" matches all emails with "a"
      mode: "insensitive",
    },
  },
  take: 5,
});
```

**Impact:** This leaks user information. Searching for "a" returns 5 arbitrary users. The `project-settings.tsx` component then uses `findData.user.id` (line 80) which is incorrect since the API returns `users` (array), not `user` (singular).

**Fix approach:** Use exact email matching (`equals`) for the member add flow. Or implement proper user invitation with email verification.

---

### 4.6 LOW: Inconsistent API Response Shapes
**Severity:** LOW
**Files:** Multiple API route files

**Issue:** API responses use inconsistent shapes:
```ts
// Some return { projects }
return NextResponse.json({ projects });

// Some return { project }
return NextResponse.json({ project });

// Some return the object directly
return NextResponse.json(project);

// Some return { request }
return NextResponse.json({ request });
```

**Impact:** Client code must handle different response structures, increasing complexity and potential bugs.

**Fix approach:** Standardize all responses to always wrap data in a named property (e.g., `{ data: project }`).

---

## 5. Missing Implementations

### 5.1 Business Rules Not Enforced on Status Changes
**Severity:** HIGH
**Files:**
- `src/app/api/projects/[projectId]/board/route.ts` (lines 104-184)
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (lines 117-205)

**Issue:** The project settings `requireEstimateBeforeStart` and `estimateRequired` are stored but never checked:

Per AGENTS.md:
> - Se `requireEstimateBeforeStart = true` → Worker DEVE estimar antes de iniciar
> - Se `estimateRequired = true` → Card NÃO pode ser movido sem estimativa

The board PATCH endpoint moves requests without any validation:
```ts
if (validatedData.status) {
  updateData.status = validatedData.status.toUpperCase(); // No business rule checks
}
```

**Impact:** Business rules are configurable but completely non-functional. Users can bypass all workflow constraints.

**Fix approach:** Before status transitions, fetch project settings and validate:
- BACKLOG → IN_PROGRESS: Check `estimatedHours` is set if `requireEstimateBeforeStart` is true
- Any → DONE: Check `estimatedHours` is set if `estimateRequired` is true

---

### 5.2 Approval Workflow Ignores No-Client Scenario
**Severity:** MEDIUM
**File:** `src/app/api/projects/[projectId]/requests/[requestId]/approve/route.ts` (lines 86-91)

**Issue:** The approval logic requires BOTH owner AND client approval to mark as DONE:
```ts
if (newApprovals.owner && newApprovals.client) {
  newStatus = "DONE";
}
```

But if the project has no client members, `newApprovals.client` will never be set to true, and requests can never reach DONE status.

**Impact:** Projects without clients have a broken approval workflow - requests get stuck in REVIEW forever.

**Fix approach:** Auto-approve client approval when no clients exist, or allow owner-only approval in projects without clients.

---

### 5.3 `loggedHours` Updates Not Protected
**Severity:** MEDIUM
**File:** `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` (line 172)

**Issue:** Any user with edit permissions can directly set `loggedHours` to any value:
```ts
if (body.loggedHours !== undefined) updateData.loggedHours = body.loggedHours;
```

**Impact:** No accumulation logic. If two workers both log hours, the second update overwrites the first. No audit trail of who logged what hours.

**Fix approach:** Implement a separate `TimeEntry` table that records individual time entries with user, timestamp, and hours. `loggedHours` should be a computed aggregate.

---

### 5.4 No Password Change/Reset Functionality
**Severity:** MEDIUM
**Files:** None (missing feature)

**Issue:** There's no endpoint or UI for users to change or reset their password. The only way to recover a lost account is database-level intervention.

**Impact:** Users who forget passwords are permanently locked out. No self-service account recovery.

---

### 5.5 No Request Pagination or Search
**Severity:** LOW
**Files:** None (missing feature)

**Issue:** No search, filtering, or pagination on request lists. The board view loads all requests.

**Impact:** As projects grow, finding specific requests becomes increasingly difficult.

---

## 6. Business Logic Risks

### 6.1 Race Condition on Board Drag-and-Drop
**Severity:** MEDIUM
**File:** `src/components/board/kanban-board.tsx` (lines 148-175)

**Issue:** The drag-and-drop handler updates local state optimistically after a successful API call, but doesn't handle concurrent modifications. If two users drag different cards simultaneously, or if data is refreshed mid-drag, the local state may become inconsistent.

```tsx
setRequests((prev) =>
  prev.map((r) =>
    r.id === requestId ? { ...r, status: newStatus! } : r
  )
);
router.refresh(); // This may overwrite the optimistic update
```

**Impact:** UI flickers, lost updates, or cards appearing in wrong columns.

---

### 6.2 Atomic Transaction Missing on Approval Workflow
**Severity:** MEDIUM
**File:** `src/app/api/projects/[projectId]/requests/[requestId]/approve/route.ts`

**Issue:** The approval update reads current state, modifies it, and writes back without a transaction:
```ts
const currentApprovals = (request.approvals as any) || {}; // Read
const newApprovals = { ...currentApprovals, [type]: true }; // Modify
await prisma.request.update({ data: { approvals: newApprovals, ... } }); // Write
```

If two approvals happen simultaneously, one will overwrite the other's changes.

**Fix approach:** Use `prisma.$transaction()` or implement optimistic concurrency control.

---

### 6.3 Position Field Not Used Consistently
**Severity:** LOW
**Files:**
- `prisma/schema.prisma` (line 128)
- `src/app/api/projects/[projectId]/board/route.ts` (line 151)

**Issue:** The `position` field exists on Request and the board API can update it, but:
- No reordering logic exists when cards are added or removed
- Position defaults to 0 for all new requests
- There's no mechanism to reorder within a column

**Impact:** Cards within a column have no meaningful ordering. The `position` field adds complexity without providing value.

---

## 7. Technical Debt

### 7.1 Single TODO in Codebase
**File:** `src/app/(dashboard)/projects/page.tsx` (line 83)
```tsx
{/* TODO: Add filter/status selector when we implement client-side filtering */}
```

**Impact:** Minor - a planned UI feature that hasn't been implemented.

---

### 7.2 PrismaAdapter Type Casting
**File:** `src/lib/auth.ts` (line 9)
```ts
adapter: PrismaAdapter(prisma) as any,
```

**Issue:** Known compatibility issue between NextAuth v5 and the Prisma adapter requires `as any` cast.

**Impact:** Type safety loss in auth configuration. Should be monitored for upstream fix.

---

### 7.3 No Testing Infrastructure
**Files:** None exist

**Issue:** No test files, no test framework configuration, no test scripts in package.json beyond default Next.js.

**Impact:** No safety net for refactoring or catching regressions. High risk when making changes to complex business logic (approvals, status transitions).

---

### 7.4 No Error Boundaries
**Files:** All page components

**Issue:** No React error boundaries are defined. A runtime error in any component will crash the entire application with no graceful fallback.

**Impact:** Poor user experience during errors. No error reporting to monitoring services.

---

## 8. Recommendations (Prioritized)

### Priority 1 - Immediate (Fix Now)
1. **Fix broken API placeholders** in `comments-section.tsx` and `attachments-section.tsx` - these are active bugs blocking core functionality
2. **Remove OWNER self-registration** - critical security vulnerability
3. **Add status enum validation** on all request status fields

### Priority 2 - Short-term (This Sprint)
4. **Implement business rule enforcement** on status transitions (estimate requirements)
5. **Extract shared Zod schemas** to `src/lib/validations/request.ts`
6. **Fix approval workflow for no-client projects**
7. **Add rate limiting** to auth endpoints
8. **Fix user enumeration** in registration

### Priority 3 - Medium-term (Next Sprint)
9. **Add pagination** to request queries
10. **Implement proper time tracking** with separate TimeEntry records
11. **Move lifecycle log** to a separate table
12. **Reduce over-fetching** in Prisma queries
13. **Add soft-delete** for projects
14. **Implement password reset** flow

### Priority 4 - Long-term (Backlog)
15. **Add testing infrastructure** (unit tests for business logic, integration tests for API)
16. **Implement real-time updates** for collaborative board editing
17. **Add React error boundaries** throughout the application
18. **Standardize API response formats**
19. **Add monitoring and error tracking** (Sentry, LogRocket, etc.)

---

## 9. Risk Matrix

| Concern | Likelihood | Impact | Risk Score | Priority |
|---------|-----------|--------|------------|----------|
| Broken API placeholders (comments/attachments) | Already broken | High - features unusable | **CRITICAL** | P1 |
| Owner self-registration | Easy to exploit | Critical - full system access | **CRITICAL** | P1 |
| Business rules not enforced | Already broken | High - workflow integrity | **HIGH** | P2 |
| No pagination on requests | Certain at scale | Medium - performance degradation | **HIGH** | P3 |
| Unbounded lifecycleLog growth | Certain over time | Medium - DB performance | **HIGH** | P3 |
| Duplicate Zod schemas | Moderate drift risk | Medium - maintenance burden | **MEDIUM** | P2 |
| Status validation weakness | Low exploitability | High - data corruption | **MEDIUM** | P2 |
| Race conditions (board, approvals) | Moderate under load | Medium - data inconsistency | **MEDIUM** | P3 |
| No rate limiting | Easy to exploit | Low - DoS potential | **MEDIUM** | P2 |
| No testing infrastructure | N/A | High - regression risk | **MEDIUM** | P4 |
| Cascade deletes | Accidental click | Critical - data loss | **MEDIUM** | P3 |
| User enumeration | Easy to exploit | Low - privacy concern | **LOW** | P2 |
| Attachment URL injection | Low exploitability | Medium - XSS potential | **LOW** | P2 |
| No password reset | User frustration | Medium - support burden | **LOW** | P3 |
| Inconsistent API responses | Already present | Low - developer experience | **LOW** | P4 |

---

*Concerns audit: 2026-03-26*
