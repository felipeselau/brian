# CONVENTIONS.md — Code Conventions

**Generated:** 2026-03-27
**Focus:** Coding style and patterns

## Code Style

### TypeScript
- **Strict mode** enabled in tsconfig.json
- **ESLint** with `eslint-config-next`
- **No implicit any** - explicit typing required

### React/Next.js Conventions

#### Server Components
- Use by default for data fetching
- Do NOT mark with `"use client"`
- Export as named exports: `export function ComponentName()`

#### Client Components
- Mark with `"use client"` when needed for:
  - Hooks (`useState`, `useEffect`, etc.)
  - Event handlers (`onClick`, etc.)
  - Browser APIs
- Export as named exports

#### Forms & Dialogs
- Use `react-hook-form` with Zod resolver
- shadcn/ui Dialog components for modals
- Submit handlers in Client Components

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProjectCard` |
| Files | kebab-case | `create-project-dialog.tsx` |
| Functions | camelCase | `handleSubmit` |
| Interfaces/Types | PascalCase | `ProjectMember` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_COLUMNS` |
| CSS Classes | kebab-case | `bg-muted-foreground` |

### Import Order

1. Library imports (react, next, etc.)
2. Absolute imports (`@/...`)
3. Relative imports (`./`, `../`)

```typescript
// 1. Library
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Absolute  
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// 3. Relative
import { ProjectList } from "./project-list";
```

### Error Handling

- API routes return `NextResponse.json({ error }, { status })`
- Use `try/catch` with error logging
- Zod validation errors handled specially
- Toast notifications for user feedback

### Database Access

- Prisma client: singleton in `src/lib/prisma.ts`
- Use `include` for relations
- Use `select` to limit returned fields

## Project-Specific Patterns

### Authentication
- Use `auth()` from `src/lib/auth.ts`
- Check `session?.user?.id` in guards
- Role stored in `session.user.role`

### Route Protection
```typescript
const session = await auth();
if (!session?.user?.id) {
  redirect("/login");
}
```

### JSON Fields
- `Project.columns` => `[ { id, title, order } ]`
- `Project.settings` => `{ requireEstimateBeforeStart, estimateRequired }`
- `Request.lifecycleLog` => `[ { from, to, by, at } ]`
- `Request.approvals` => `{ owner?, client? }`

## Git Commit Convention

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
Scopes: `projects`, `requests`, `board`, `auth`, `api`, `ui`, `db`

Example: `feat(board): add drag and drop`