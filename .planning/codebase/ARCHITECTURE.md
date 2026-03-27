# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Next.js 14 App Router with Server-Side Rendering, Client-Side Mutations

**Key Characteristics:**
- Server Components as the default rendering strategy for pages
- Client Components marked with `"use client"` only for interactive elements (forms, drag-and-drop, stateful UI)
- Direct Prisma queries in Server Components for initial data loading
- REST API routes for mutations (POST/PATCH/DELETE) called via `fetch()` from Client Components
- JWT-based authentication via NextAuth.js v5 with Credentials Provider
- Middleware handles route-level auth redirects; Server Components re-verify sessions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                          │
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │   Server Components │    │        Client Components             │ │
│  │   (RSC, no "use     │    │   ("use client" directive)          │ │
│  │   client")          │    │                                     │ │
│  │                     │    │  • Forms (Login, Register, Create)  │ │
│  │  • Page data fetch  │    │  • KanbanBoard (DnD)               │ │
│  │  • Auth checks      │    │  • Dialogs & Modals                │ │
│  │  • Pass props down  │───>│  • Interactive lists               │ │
│  │                     │    │                                     │ │
│  └──────────┬──────────┘    └──────────┬──────────────────────────┘ │
│             │                          │                            │
│             │                          │ fetch() calls              │
│             ▼                          ▼                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App Router                         │   │
│  │                                                              │   │
│  │  middleware.ts ──> Route Protection (redirect to /login)     │   │
│  │                                                              │   │
│  │  (auth)/ ──────────── Public Routes (login, register)       │   │
│  │  (dashboard)/ ─────── Protected Routes (session required)   │   │
│  │  api/ ─────────────── REST API Endpoints                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Server Layer                             │   │
│  │                                                              │   │
│  │  auth.ts ──────────── NextAuth v5 (JWT, Credentials)        │   │
│  │  prisma.ts ─────────── Prisma Client Singleton              │   │
│  │  validations/ ─────── Zod Schemas                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                        │   │
│  │  users, projects, project_members, requests,                 │   │
│  │  comments, attachments                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Layers

### Presentation Layer
- **Purpose:** Render UI via Server Components and handle interactivity via Client Components
- **Location:** `src/app/` (pages/layouts), `src/components/` (reusable UI)
- **Contains:** Route pages (Server Components), interactive components (Client Components)
- **Depends on:** `@/lib/auth`, `@/lib/prisma`, `@/components/ui/*`
- **Used by:** Browser (direct page loads)

### API Layer
- **Purpose:** Handle mutations and provide REST endpoints for Client Components
- **Location:** `src/app/api/`
- **Contains:** Route handlers with GET/POST/PATCH/DELETE methods
- **Depends on:** `@/lib/auth`, `@/lib/prisma`, `@/lib/validations/*`
- **Used by:** Client Components via `fetch()`

### Data Access Layer
- **Purpose:** Database interaction via Prisma ORM
- **Location:** `src/lib/prisma.ts` (singleton), inline queries in pages/API routes
- **Contains:** Prisma client, direct queries with `include`/`select`
- **Depends on:** `@prisma/client`, `DATABASE_URL` env var
- **Used by:** Server Components (direct queries), API routes (mutations)

### Validation Layer
- **Purpose:** Input validation for API routes
- **Location:** `src/lib/validations/`
- **Contains:** Zod schemas with type inference
- **Depends on:** `zod`, `@prisma/client` (for enums)
- **Used by:** API route handlers via `.parse()` or `.safeParse()`

### Authentication Layer
- **Purpose:** User authentication and session management
- **Location:** `src/lib/auth.ts`, `src/middleware.ts`
- **Contains:** NextAuth config, JWT callbacks, middleware route protection
- **Depends on:** `next-auth`, `@auth/prisma-adapter`, `bcryptjs`
- **Used by:** All Server Components and API routes for session checks

## Data Flow

### Page Load Flow (Server-Side)
1. Browser requests page → `middleware.ts` checks auth → redirects if needed
2. Server Component in `src/app/(dashboard)/*/page.tsx` runs
3. `const session = await auth()` retrieves JWT session
4. `if (!session?.user?.id) redirect("/login")` enforces auth
5. Prisma queries run directly in the Server Component
6. Server-rendered HTML with data sent to browser
7. Client Components hydrate with interactive behavior

### Mutation Flow (Client-Side)
1. Client Component (e.g., `CreateProjectDialog`) collects user input
2. `fetch("/api/projects", { method: "POST", body: JSON.stringify(data) })`
3. API route handler authenticates: `const session = await auth()`
4. API route validates input: `validatedData = schema.parse(body)`
5. API route checks permissions (role-based: OWNER/WORKER/CLIENT)
6. Prisma mutation executes (create/update/delete)
7. Response returned as JSON
8. Client Component calls `router.refresh()` to trigger Server Component re-render

### Drag-and-Drop Flow
1. `KanbanBoard` (Client Component) manages local state with `useState`
2. User drags card → `handleDragStart` sets active request
3. User drops card → `handleDragEnd` determines new status
4. `fetch("/api/projects/[projectId]/board", { method: "PATCH" })` persists change
5. Local state updates optimistically
6. `router.refresh()` syncs server state

## Route Structure

### Public Routes (Route Group: `(auth)`)
| Route | Page | Purpose |
|-------|------|---------|
| `/login` | `src/app/(auth)/login/page.tsx` | User login |
| `/register` | `src/app/(auth)/register/page.tsx` | User registration |

**Layout:** `src/app/(auth)/layout.tsx` — centered card on gray background, no navbar

### Protected Routes (Route Group: `(dashboard)`)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard with stats |
| `/projects` | `src/app/(dashboard)/projects/page.tsx` | All projects list |
| `/projects/[projectId]` | `src/app/(dashboard)/projects/[projectId]/page.tsx` | Project detail + board |
| `/projects/[projectId]/settings` | `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` | Project settings |
| `/projects/[projectId]/requests/[requestId]` | `src/app/(dashboard)/projects/[projectId]/requests/[requestId]/page.tsx` | Request detail |

**Layout:** `src/app/(dashboard)/layout.tsx` — Server Component that checks auth and renders `Navbar`

### API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers |
| `/api/auth/register` | POST | User registration |
| `/api/users` | GET | Search users by email |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[projectId]` | GET, PATCH, DELETE | Get/update/delete project |
| `/api/projects/[projectId]/members` | GET, POST, DELETE | Manage project members |
| `/api/projects/[projectId]/board` | GET, PATCH | Get board / move request |
| `/api/projects/[projectId]/requests` | GET, POST | List/create requests |
| `/api/projects/[projectId]/requests/[requestId]` | GET, PATCH, DELETE | Get/update/delete request |
| `/api/projects/[projectId]/requests/[requestId]/comments` | GET, POST, DELETE | Manage comments |
| `/api/projects/[projectId]/requests/[requestId]/attachments` | GET, POST, DELETE | Manage attachments |
| `/api/projects/[projectId]/requests/[requestId]/approve` | POST | Approve request |
| `/api/projects/[projectId]/requests/[requestId]/reject` | POST | Reject request |

## Component Architecture

### Server Components (Default)
All page files (`page.tsx`) and the dashboard layout are Server Components. They:
- Fetch data directly via Prisma
- Check authentication via `auth()`
- Pass data as props to Client Components
- Handle redirects for unauthorized access

**Example pattern** (from `src/app/(dashboard)/dashboard/page.tsx`):
```tsx
export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({ ... });

  return <ProjectList projects={projects} currentUserId={session.user.id} />;
}
```

### Client Components (Explicit `"use client"`)
Interactive components that need:
- React hooks (`useState`, `useEffect`)
- Browser APIs (`useRouter`, event handlers)
- Third-party client libraries (`@dnd-kit`, `next-auth/react`, `sonner`)

**Files marked as Client Components:**
- `src/components/auth/login-form.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/layout/user-menu.tsx`
- `src/components/projects/project-list.tsx`
- `src/components/projects/project-card.tsx`
- `src/components/projects/create-project-dialog.tsx`
- `src/components/projects/project-settings.tsx`
- `src/components/board/kanban-board.tsx`
- `src/components/board/board-column.tsx`
- `src/components/board/request-card.tsx`
- `src/components/requests/create-request-dialog.tsx`
- `src/components/requests/comments-section.tsx`
- `src/components/requests/attachments-section.tsx`
- `src/app/(dashboard)/projects/[projectId]/board-wrapper.tsx`

### Pure Server Components (No `"use client"`)
- `src/components/layout/navbar.tsx` — receives user data as props from layout
- All `page.tsx` files
- `src/app/(auth)/layout.tsx`
- `src/app/(dashboard)/layout.tsx`

## Authentication Flow

### Middleware (`src/middleware.ts`)
```
Request → middleware.ts
  ├── Public route (/login, /register)?
  │   ├── Logged in? → Redirect to /dashboard
  │   └── Not logged in? → Allow access
  └── Protected route?
      ├── Logged in? → Allow access
      └── Not logged in? → Redirect to /login
```

**Matcher config:** Excludes `/api`, `/_next/static`, `/_next/image`, `favicon.ico`

### Server-Side Auth
- Every Server Component calls `const session = await auth()`
- Every API route calls `const session = await auth()` at the top
- Never trust middleware alone — always verify session in the component/route

### JWT Strategy
- `src/lib/auth.ts` configures JWT session strategy
- JWT callback enriches token with `id` and `role`
- Session callback copies `id` and `role` to `session.user`
- Custom types in `src/types/auth.ts` extend `Session` and `JWT` interfaces

## State Management

**No global state library.** State management is handled through:

1. **Server state:** Prisma queries in Server Components (fresh on each request)
2. **URL state:** `searchParams` for filters (e.g., `?status=ACTIVE` on projects page)
3. **Local component state:** `useState` for form inputs, dialogs, loading states
4. **Router refresh:** `router.refresh()` after mutations to re-trigger Server Component data fetch

**Pattern:**
```tsx
// Client Component mutation
const handleSubmit = async () => {
  await fetch("/api/projects", { method: "POST", body: ... });
  router.refresh(); // Re-fetches server data
};
```

## Error Handling

### API Routes
```tsx
try {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const validatedData = schema.parse(body);
  // ... mutation
} catch (error) {
  if (error.name === "ZodError") {
    return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### Client Components
```tsx
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error(...);
  toast.success("Success!");
  router.refresh();
} catch (error) {
  toast.error(error instanceof Error ? error.message : "Failed");
}
```

### Pages
- `notFound()` for missing resources
- `redirect("/dashboard")` for unauthorized access
- `redirect("/login")` for unauthenticated users

## Key Architectural Decisions

1. **No dedicated service layer:** Prisma queries are inline in Server Components and API routes. This keeps the architecture simple for the current scope but may need refactoring as complexity grows.

2. **Dual auth verification:** Middleware provides UX-level redirects, but all Server Components and API routes independently verify sessions for security.

3. **JSON fields for flexible data:** `columns`, `settings`, `approvals`, and `lifecycleLog` are stored as JSON in PostgreSQL, allowing schema flexibility without migrations.

4. **Co-located page components:** Some interactive components (e.g., `edit-request-form.tsx`, `approvals-section.tsx`, `board-wrapper.tsx`) are co-located with their page routes in `src/app/` rather than in `src/components/`.

5. **No barrel files for most directories:** Only `src/components/board/index.ts` uses barrel exports. Most imports reference files directly.

6. **Role-based access control:** Three roles (OWNER, WORKER, CLIENT) with different permissions enforced at the API route level, not via middleware.

---

*Architecture analysis: 2026-03-26*
