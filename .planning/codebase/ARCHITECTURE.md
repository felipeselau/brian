# ARCHITECTURE.md — System Architecture

**Generated:** 2026-03-27
**Focus:** Architecture and design patterns

## Architecture Pattern

### Next.js App Router
- **Server Components** for data fetching
- **Client Components** for interactivity (`use client`)
- **Route Groups** using `(auth)` and `(dashboard)` folders

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Public routes (login, register)
│   ├── (dashboard)/    # Protected routes (dashboard, projects)
│   └── api/            # API routes (REST endpoints)
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── board/         # Kanban board components
│   ├── projects/      # Project-related components
│   ├── requests/      # Request card components
│   ├── layout/        # Layout components
│   └── auth/          # Auth form components
├── lib/               # Core utilities
│   ├── auth.ts       # NextAuth configuration
│   ├── prisma.ts     # Prisma client singleton
│   └── utils.ts      # Utility functions
└── types/             # TypeScript type definitions
```

## Data Flow

### Server-Side Data Fetching
1. **Page requests data** via Prisma in Server Component
2. **Session check** via `auth()` from `src/lib/auth.ts`
3. **Data returned** to component, rendered on server
4. **Client-side interactions** via form components with `use client`

### Request Lifecycle
1. Client submits form → API route
2. API validates with Zod schema
3. Prisma performs database operation
4. Response returned to client
5. `router.refresh()` updates UI

### Authentication Flow
1. User submits credentials to NextAuth
2. Credentials verified against database (bcrypt)
3. JWT token created with user.id and role
4. Session persisted via HTTP-only cookie
5. Protected routes check session via `auth()`

## Key Abstractions

### Prisma Schema
- All data models defined in `prisma/schema.prisma`
- JSON fields for flexible data (`columns`, `settings`, `lifecycleLog`)

### API Structure
- RESTful API routes in `src/app/api/`
- Each resource has dedicated route file
- Proper error handling and validation

### Component Patterns
- **Dialog components** for creating/editing
- **Tabs** for organizing content
- **Forms** with Zod validation

## Entry Points

| Path | Purpose |
|------|---------|
| `/login` | User authentication |
| `/register` | User registration |
| `/dashboard` | Project list |
| `/projects/[id]` | Project detail + board |
| `/projects/[id]/requests/[id]` | Request detail |