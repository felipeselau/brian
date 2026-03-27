# STRUCTURE.md — Directory Structure

**Generated:** 2026-03-27
**Focus:** Directory layout and organization

## Top-Level Structure

```
brian/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/           # Core utilities
│   └── types/         # TypeScript types
├── prisma/            # Database schema
├── public/            # Static assets
├── .env               # Environment (not committed)
├── next.config.mjs    # Next.js config
├── tailwind.config.ts # Tailwind config
└── tsconfig.json      # TypeScript config
```

## Source Directory Structure

### App Routes (`src/app/`)

```
app/
├── (auth)/                    # Auth route group
│   ├── layout.tsx            # Auth layout
│   ├── login/page.tsx        # Login page
│   └── register/page.tsx     # Register page
├── (dashboard)/              # Protected route group
│   ├── dashboard/page.tsx    # Dashboard
│   └── projects/
│       ├── page.tsx          # Projects list
│       └── [projectId]/
│           ├── page.tsx      # Project detail
│           ├── settings/
│           │   └── page.tsx  # Project settings
│           └── requests/
│               └── [requestId]/
│                   └── page.tsx
└── api/                      # API routes
    ├── auth/
    │   └── [...nextauth]/
    ├── projects/
    │   ├── [projectId]/
    │   │   ├── members/
    │   │   ├── board/
    │   │   └── requests/
    │   └── route.ts
    └── users/
```

### Components (`src/components/`)

```
components/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   └── ...
├── board/                  # Kanban board
│   ├── kanban-board.tsx
│   ├── board-column.tsx
│   └── request-card.tsx
├── projects/               # Project UI
│   ├── project-list.tsx
│   ├── project-card.tsx
│   ├── create-project-dialog.tsx
│   └── project-settings.tsx
├── requests/               # Request UI
│   ├── create-request-dialog.tsx
│   ├── comments-section.tsx
│   └── attachments-section.tsx
└── layout/                 # Layout
    ├── navbar.tsx
    └── user-menu.tsx
```

### Library (`src/lib/`)

```
lib/
├── auth.ts        # NextAuth config + exports
├── prisma.ts      # Prisma client singleton
├── utils.ts       # cn() utility
└── validations/   # Zod schemas
    └── project.ts
```

## File Naming Conventions

- **Pages:** `page.tsx`
- **Layouts:** `layout.tsx`
- **API Routes:** `route.ts`
- **Components:** `kebab-case.tsx`
- **Utilities:** `kebab-case.ts`

## Key File Locations

| Purpose | Path |
|---------|------|
| Auth config | `src/lib/auth.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Zod schemas | `src/lib/validations/` |
| Route groups | `src/app/(auth)/` `src/app/(dashboard)/` |
| Board components | `src/components/board/` |
| Request components | `src/components/requests/` |