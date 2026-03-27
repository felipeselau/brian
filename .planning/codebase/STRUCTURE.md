# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
brian/
├── prisma/
│   └── schema.prisma            # Database schema (User, Project, Request, etc.)
├── src/
│   ├── app/
│   │   ├── (auth)/              # Route group: public auth pages
│   │   │   ├── layout.tsx       # Centered card layout (Server Component)
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Login page (Server Component, renders LoginForm)
│   │   │   └── register/
│   │   │       └── page.tsx     # Register page (Server Component, renders RegisterForm)
│   │   ├── (dashboard)/         # Route group: protected pages
│   │   │   ├── layout.tsx       # Auth check + Navbar (Server Component)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Dashboard with stats + recent projects
│   │   │   └── projects/
│   │   │       ├── page.tsx     # All projects list
│   │   │       └── [projectId]/
│   │   │           ├── page.tsx           # Project detail with board + settings tabs
│   │   │           ├── board-wrapper.tsx  # Client Component: board + create request
│   │   │           ├── settings/
│   │   │           │   ├── page.tsx       # Settings page
│   │   │           │   └── settings-form.tsx  # Settings form (Client Component)
│   │   │           └── requests/
│   │   │               └── [requestId]/
│   │   │                   ├── page.tsx              # Request detail page
│   │   │                   ├── edit-request-form.tsx # Edit form (Client Component)
│   │   │                   └── approvals-section.tsx # Approvals UI (Client Component)
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth GET/POST handlers
│   │   │   │   └── register/route.ts       # POST /api/auth/register
│   │   │   ├── users/
│   │   │   │   └── route.ts                # GET /api/users?email=...
│   │   │   └── projects/
│   │   │       ├── route.ts                # GET,POST /api/projects
│   │   │       └── [projectId]/
│   │   │           ├── route.ts            # GET,PATCH,DELETE /api/projects/[projectId]
│   │   │           ├── board/route.ts      # GET,PATCH /api/projects/[projectId]/board
│   │   │           ├── members/route.ts    # GET,POST,DELETE /api/projects/[projectId]/members
│   │   │           └── requests/
│   │   │               ├── route.ts        # GET,POST /api/.../requests
│   │   │               └── [requestId]/
│   │   │                   ├── route.ts        # GET,PATCH,DELETE /api/.../requests/[requestId]
│   │   │                   ├── comments/route.ts   # GET,POST,DELETE /api/.../comments
│   │   │                   ├── attachments/route.ts # GET,POST,DELETE /api/.../attachments
│   │   │                   ├── approve/route.ts     # POST /api/.../approve
│   │   │                   └── reject/route.ts      # POST /api/.../reject
│   │   ├── globals.css          # Global styles + Tailwind
│   │   ├── layout.tsx           # Root layout (html, body, Toaster)
│   │   └── page.tsx             # Root page (redirects to /dashboard)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (DO NOT modify manually)
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   │   ├── auth/                # Auth form components
│   │   │   ├── login-form.tsx       # Client Component
│   │   │   └── register-form.tsx    # Client Component
│   │   ├── layout/              # Layout shell components
│   │   │   ├── navbar.tsx           # Server Component (receives user as props)
│   │   │   └── user-menu.tsx        # Client Component (avatar dropdown)
│   │   ├── projects/            # Project-related components
│   │   │   ├── project-card.tsx         # Client Component (card with dropdown actions)
│   │   │   ├── project-list.tsx         # Client Component (grid of cards, delete/archive)
│   │   │   ├── create-project-dialog.tsx # Client Component (create form dialog)
│   │   │   └── project-settings.tsx     # Client Component (member management)
│   │   ├── board/               # Kanban board components
│   │   │   ├── index.ts               # Barrel exports
│   │   │   ├── kanban-board.tsx       # Client Component (DndContext, drag logic)
│   │   │   ├── board-column.tsx       # Client Component (droppable column)
│   │   │   └── request-card.tsx       # Client Component (sortable card)
│   │   ├── requests/            # Request-related components
│   │   │   ├── create-request-dialog.tsx  # Client Component (create form)
│   │   │   ├── comments-section.tsx       # Client Component (comment list + add)
│   │   │   └── attachments-section.tsx    # Client Component (attachment list + upload)
│   │   └── shared/              # (Empty — reserved for future shared components)
│   ├── lib/
│   │   ├── auth.ts              # NextAuth v5 config (JWT, callbacks, providers)
│   │   ├── prisma.ts            # Prisma client singleton (dev hot-reload safe)
│   │   ├── utils.ts             # cn() utility (clsx + tailwind-merge)
│   │   ├── validations/
│   │   │   └── project.ts       # Zod schemas for Project CRUD
│   │   ├── api/                 # (Empty — reserved for API helpers)
│   │   └── hooks/               # (Empty — reserved for shared hooks)
│   ├── types/
│   │   ├── index.ts             # Re-exports Prisma types + extended types + defaults
│   │   └── auth.ts              # Module augmentation for next-auth Session/JWT
│   └── middleware.ts            # Route protection (redirect logic)
├── .planning/                   # Planning documents (GSD-generated)
├── AGENTS.md                    # Project conventions reference
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
└── components.json              # shadcn/ui config
```

## Directory Purposes

### `src/app/`
Next.js App Router directory. Contains all routes, layouts, and API endpoints.

**Route Groups:**
- `(auth)` — Public pages (login, register). Layout provides centered card styling. No navbar.
- `(dashboard)` — Protected pages. Layout checks auth and renders Navbar.
- Parentheses `()` mean the group name is not in the URL path.

**Co-located Components:**
Some Client Components live alongside their page routes in `src/app/` rather than `src/components/`:
- `src/app/(dashboard)/projects/[projectId]/board-wrapper.tsx`
- `src/app/(dashboard)/projects/[projectId]/settings/settings-form.tsx`
- `src/app/(dashboard)/projects/[projectId]/requests/[requestId]/edit-request-form.tsx`
- `src/app/(dashboard)/projects/[projectId]/requests/[requestId]/approvals-section.tsx`

### `src/components/`
Reusable React components organized by domain.

| Directory | Purpose | Component Type |
|-----------|---------|----------------|
| `ui/` | shadcn/ui primitives | Mixed (mostly thin Radix wrappers) |
| `auth/` | Login/register forms | Client Components |
| `layout/` | Navbar, UserMenu | Mixed (navbar is Server, user-menu is Client) |
| `projects/` | Project CRUD UI | Client Components |
| `board/` | Kanban board + DnD | Client Components |
| `requests/` | Comments, attachments | Client Components |
| `shared/` | Reserved for future use | — |

### `src/lib/`
Core utilities and configuration.

| File/Dir | Purpose |
|----------|---------|
| `auth.ts` | NextAuth v5 configuration (providers, callbacks, JWT strategy) |
| `prisma.ts` | Prisma client singleton with dev hot-reload protection |
| `utils.ts` | `cn()` utility combining `clsx` and `tailwind-merge` |
| `validations/` | Zod schemas for input validation |
| `api/` | Reserved for shared API helpers (currently empty) |
| `hooks/` | Reserved for shared React hooks (currently empty) |

### `src/types/`
TypeScript type definitions and module augmentations.

| File | Purpose |
|------|---------|
| `index.ts` | Re-exports Prisma types, defines extended types (`ProjectWithRelations`, `RequestWithRelations`), exports defaults (`DEFAULT_COLUMNS`, `DEFAULT_PROJECT_SETTINGS`) |
| `auth.ts` | Module augmentation extending `next-auth` `Session` and `JWT` with custom fields (`id`, `role`) |

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` — Root redirect to `/dashboard`
- `src/app/(dashboard)/dashboard/page.tsx` — Main dashboard
- `src/app/(auth)/login/page.tsx` — Login entry

**Configuration:**
- `src/lib/auth.ts` — Auth config (providers, JWT callbacks)
- `src/lib/prisma.ts` — Database client
- `prisma/schema.prisma` — Database schema
- `src/middleware.ts` — Route protection

**Core Logic:**
- `src/app/api/` — All business logic is in API routes (no service layer)
- `src/lib/validations/project.ts` — Validation schemas

**Testing:**
- No test files detected in the codebase

## Import Patterns

### Path Alias
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Always use absolute imports: `@/components/ui/button` not `../../../components/ui/button`

### Import Order (Convention)
1. Library imports (`react`, `next/*`, `@prisma/client`, `next-auth`)
2. Absolute imports (`@/lib/*`, `@/components/*`, `@/types/*`)
3. Relative imports (rare — only for co-located files)

### Example Import Block
```tsx
import { auth } from "@/lib/auth";                    // Library
import { redirect } from "next/navigation";           // Library
import prisma from "@/lib/prisma";                    // Absolute
import { ProjectList } from "@/components/projects/project-list"; // Absolute
import { UserRole } from "@prisma/client";            // Library
```

### Barrel Exports
Only `src/components/board/index.ts` uses barrel exports:
```ts
export { KanbanBoard } from "./kanban-board";
export { BoardColumn } from "./board-column";
export { RequestCard } from "./request-card";
```

All other components are imported directly by filename.

## File Naming Conventions

**Files:**
- kebab-case: `project-card.tsx`, `kanban-board.tsx`, `edit-request-form.tsx`
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)

**Components:**
- PascalCase function names: `export function ProjectCard()`
- Named exports (no default exports): `export function ComponentName()`
- Interface for props: `interface ProjectCardProps { ... }`

**Directories:**
- kebab-case: `components/projects/`, `lib/validations/`
- Route groups use parentheses: `(auth)/`, `(dashboard)/`
- Dynamic routes use brackets: `[projectId]/`, `[requestId]/`

## Where to Add New Code

### New Feature
- **Page:** `src/app/(dashboard)/[feature]/page.tsx`
- **Co-located client component:** `src/app/(dashboard)/[feature]/[component].tsx`
- **Shared component:** `src/components/[feature]/[component].tsx`
- **API route:** `src/app/api/[resource]/route.ts`
- **Validation schema:** `src/lib/validations/[resource].ts`

### New Component
- **UI primitive:** `src/components/ui/[name].tsx` (via `npx shadcn-ui@latest add`)
- **Feature component:** `src/components/[feature]/[name].tsx`
- **Shared component:** `src/components/shared/[name].tsx`

### New API Endpoint
1. Create route file at `src/app/api/[resource]/route.ts` or `src/app/api/[resource]/[id]/route.ts`
2. Add Zod schema in `src/lib/validations/[resource].ts`
3. Export handlers: `export async function GET/POST/PATCH/DELETE(req) { ... }`

### New Utility/Hook
- **Utility:** `src/lib/[name].ts`
- **Hook:** `src/lib/hooks/use-[name].ts`

## API Route Pattern

Every API route follows this structure:
```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ /* ... */ });

export async function GET/POST/PATCH/DELETE(
  req: NextRequest,
  { params }: { params: { /* dynamic params */ } }
) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input (for POST/PATCH)
    const body = await req.json();
    const validatedData = schema.parse(body);

    // 3. Permission check
    // ...

    // 4. Prisma operation
    const result = await prisma.model.create/update/delete/findMany/...;

    // 5. Return response
    return NextResponse.json({ data: result });
  } catch (error) {
    // 6. Error handling
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui primitives (Button, Card, Dialog, etc.)
- Generated: Yes (via `npx shadcn-ui@latest add`)
- Committed: Yes
- Modification: Avoid manual edits; re-generate via CLI if needed

**`prisma/`:**
- Purpose: Database schema and migrations
- Key file: `prisma/schema.prisma`
- Generated: Prisma client auto-generated into `node_modules/@prisma/client`

**`.planning/`:**
- Purpose: GSD planning documents (codebase analysis, phase plans)
- Generated: Yes (by GSD commands)
- Committed: Optional

**Empty directories (reserved for future use):**
- `src/lib/api/` — Shared API helpers
- `src/lib/hooks/` — Shared React hooks
- `src/components/shared/` — Cross-feature shared components

---

*Structure analysis: 2026-03-26*
