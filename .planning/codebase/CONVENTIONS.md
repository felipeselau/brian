# Coding Conventions

**Analysis Date:** 2026-03-26

## TypeScript Configuration

**Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`)
- Full type checking enforced

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Used throughout codebase for absolute imports

**Module Resolution:** Bundler (`"moduleResolution": "bundler"`)
**JSX:** Preserved

## Naming Conventions

### Files
| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `project-card.tsx`, `request-card.tsx` |
| API Routes | kebab-case | `[projectId]/board/route.ts` |
| Utilities | kebab-case | `auth.ts`, `prisma.ts`, `utils.ts` |
| Validations | kebab-case | `project.ts`, `request.ts` |

### Variables & Functions
- **Functions/Components**: PascalCase - `export function ProjectCard()`
- **Props Interfaces**: PascalCase with `Props` suffix - `interface ProjectCardProps`
- **Types/Interfaces**: PascalCase - `type CreateProjectInput`
- **Constants**: UPPER_SNAKE_CASE - `DEFAULT_COLUMNS`

### Database Field Names (Prisma conventions)
| Prisma Field | Alternative to avoid |
|--------------|---------------------|
| `title` | `name` |
| `loggedHours` | `hoursSpent` |
| `estimatedHours` | `estimate` |
| `createdById` | `authorId` |
| `assignedToId` | `assigneeId` |

## Code Style

### Formatting Tool
- Uses Next.js defaults via `eslint-config-next`
- No custom Prettier config detected (no `.prettierrc` file)

### Linting
- **Config:** `.eslintrc.json` extends `next/core-web-vitals`
- **Commands:**
  ```bash
  npm run lint          # Run ESLint
  npx tsc --noEmit      # TypeScript check
  ```

### Tailwind Usage
- Semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`
- Standard classes: `rounded-lg`, `hover:shadow-lg transition-shadow`
- Responsive grids: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`
- Base color: `slate` (defined in `components.json`)
- CSS variables enabled

## Component Patterns

### Client vs Server Components
- **Server Components:** Default, no marker needed
- **Client Components:** Mark with `"use client"` directive at top
  ```typescript
  "use client";
  
  import { useState } from "react";
  // ...
  ```

### Props Interface Pattern
```typescript
interface ProjectCardProps {
  project: ProjectWithCounts;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export function ProjectCard({
  project,
  isOwner,
  onEdit,
  onDelete,
  onArchive,
}: ProjectCardProps) {
  // Implementation
}
```

### Named Exports Required
```typescript
// ✅ Correct - Named export
export function ProjectCard() { }

// ❌ Wrong - Default export
export default function ProjectCard() { }
```

### Component Organization
From `components.json`:
```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Import Organization

### Order (as observed in codebase)
1. `"use client"` directive (if client component)
2. React imports (`useState`, `useEffect`, etc.)
3. Next.js imports (`Link`, `useRouter`, etc.)
4. Third-party UI components (`@/components/ui/*`)
5. Other library imports (`@dnd-kit/*`, `next-auth/react`)
6. Absolute paths (`@/lib/*`, `@/types/*`)
7. Relative imports (if needed)

### Path Aliases
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations/project";
import { DEFAULT_COLUMNS } from "@/types";
```

## Error Handling

### API Routes Pattern
```typescript
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... handler logic
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Zod Validation Errors
```typescript
catch (error: any) {
  console.error("Error creating project:", error);
  
  if (error.name === "ZodError") {
    return NextResponse.json(
      { error: "Validation error", details: error.errors },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

### Client-Side Error Handling
- Uses `sonner` for toast notifications (`import { toast } from "sonner"`)
- Try/catch with loading state management
- User-friendly error messages via toast

## Validation Patterns (Zod)

### Schema Location
- All Zod schemas in `src/lib/validations/<resource>.ts`
- E.g., `src/lib/validations/project.ts`

### Schema Structure
```typescript
import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  columns: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      order: z.number(),
    })
  ).optional(),
  settings: z.object({
    requireEstimateBeforeStart: z.boolean(),
    estimateRequired: z.boolean(),
  }).optional(),
});

// Type inference
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### Usage in API Routes
```typescript
const body = await req.json();
const validatedData = createProjectSchema.parse(body);
```

### Supported Validation Features
- `z.string().min().max()` - String constraints
- `z.nativeEnum()` - Enum validation
- `z.object()` with nested objects
- `z.array()` with schema
- `z.string().or(z.date())` - Union types (string or Date)
- `z.infer<typeof schema>` for TypeScript inference

## Authentication Patterns

### NextAuth v5 Configuration
- Located in `src/lib/auth.ts`
- Uses JWT session strategy
- Credentials provider for email/password auth

### Server Components
```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user?.id) {
  redirect("/login");
}
```

### API Routes
```typescript
import { auth } from "@/lib/auth";
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Role Checking
```typescript
if (session.user.role !== "OWNER") {
  return NextResponse.json(
    { error: "Only owners can create projects" },
    { status: 403 }
  );
}
```

## Prisma Patterns

### Client Singleton
```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;
```

### Include for Relations
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    },
    members: {
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    },
  },
});
```

### Select to Limit Fields
Use `select` to limit returned fields:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### Prisma Exports
Types re-exported from `@/types/index.ts`:
```typescript
import { User, Project, Request, Comment, Attachment, ProjectMember } from "@prisma/client";
export type { User, Project, Request, Comment, Attachment, ProjectMember };
```

## Enums (Prisma)

| Enum | Values |
|------|--------|
| UserRole | OWNER, WORKER, CLIENT |
| ProjectStatus | ACTIVE, ARCHIVED |
| RequestStatus | BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED, WAITING |

## JSON Field Structures

| Field | Structure |
|-------|-----------|
| `Project.columns` | `[{ id: string, title: string, order: number }]` |
| `Project.settings` | `{ requireEstimateBeforeStart: boolean, estimateRequired: boolean }` |
| `Request.approvals` | `{ owner?: boolean, client?: boolean }` |
| `Request.lifecycleLog` | `[{ from: string, to: string, by: string, at: string }]` |

## Business Rules (Enforced)

1. **Owner-only operations:** Only `OWNER` can create/edit/delete projects
2. **Role-based access:** Different permissions for OWNER, WORKER, CLIENT
3. **Estimate requirements:** If `requireEstimateBeforeStart = true` → Worker MUST estimate before starting
4. **Lifecycle log:** Append-only, never overwritten (tracked in `Request.lifecycleLog`)
5. **Cascade delete:** Deleting project hard deletes all requests (via Prisma cascade)

## Git Conventions

### Commit Format
```
<type>(<scope>): <subject>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `style` - Formatting changes
- `chore` - Maintenance, dependencies

### Scopes
- `projects`, `requests`, `board`, `auth`, `api`, `ui`, `db`

### Examples
```bash
feat(board): add drag and drop
fix(auth): handle null session
refactor(projects): simplify CRUD logic
```

## Quality Checks

Before committing, run locally:
```bash
npm run lint         # ESLint
npx tsc --noEmit    # TypeScript check
npm run build       # Production build
```

---

*Convention analysis: 2026-03-26*