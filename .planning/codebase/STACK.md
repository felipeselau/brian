# STACK.md — Technology Stack

**Generated:** 2026-03-27
**Focus:** Tech stack analysis

## Core Technologies

### Runtime & Framework
- **Runtime:** Node.js 20.x
- **Framework:** Next.js 14.2.x (App Router)
- **UI Framework:** React 18.3.x

### Languages
- **Primary:** TypeScript 5.5.x
- **Styling:** Tailwind CSS 3.4.x

### Dependencies (Key)

| Category | Package | Version |
|----------|---------|---------|
| ORM | `@prisma/client` | 5.14.x |
| Auth | `next-auth` | 5.0.0-beta |
| Drag & Drop | `@dnd-kit/core` | 6.1.x |
| UI Components | `@radix-ui/*` | 1.1.x |
| Forms | `react-hook-form` + `zod` | 7.51.x |
| Icons | `lucide-react` | 0.424.x |
| Database | PostgreSQL (via Prisma) | - |
| File Storage | `@vercel/blob` | 0.23.x |

### Dev Dependencies

- **Linting:** ESLint 8.x + eslint-config-next
- **Types:** @types/node, @types/react, @types/react-dom
- **CSS:** PostCSS + autoprefixer
- **Database:** Prisma 5.14.x (ORM)

## Configuration Files

- `next.config.mjs` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind configuration
- `postcss.config.js` — PostCSS configuration
- `.eslintrc.json` — ESLint configuration
- `prisma/schema.prisma` — Database schema

## Environment Variables

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Key Notes

- NextAuth v5 with credentials provider for auth
- Prisma ORM with PostgreSQL
- shadcn/ui components built on Radix primitives
- Zod for form validation
- Tailwind CSS with `tailwind-merge` and `clsx` for class utilities