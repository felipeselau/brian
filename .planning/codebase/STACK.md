# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript ~5.5.3 — All application code (strict mode enabled)

**Secondary:**
- CSS (via Tailwind) — Styling through utility classes and CSS variables

## Runtime

**Environment:**
- Node.js (no specific version pinned; no `.nvmrc` or `.node-version` present)

**Package Manager:**
- npm (default)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ~14.2.18 — Full-stack framework (App Router, Server Components, API Routes)
- React ~18.3.1 — UI library
- React DOM ~18.3.1

**Testing:**
- Not configured — No test framework, test files, or test scripts found

**Build/Dev:**
- PostCSS ~8.4.39 — CSS processing pipeline
- Autoprefixer ~10.4.19 — Vendor prefix automation

## Key Dependencies

**Database & ORM:**
- `@prisma/client` ~5.14.0 — Prisma ORM client (PostgreSQL)
- `prisma` ~5.14.0 (dev) — Prisma CLI for migrations and codegen

**Authentication:**
- `next-auth` ~5.0.0-beta.22 — NextAuth.js v5 (beta)
- `@auth/prisma-adapter` ~2.11.1 — Prisma adapter for NextAuth
- `bcryptjs` ~2.4.3 — Password hashing (bcrypt with salt rounds = 10)

**UI Components (shadcn/ui - Radix primitives):**
- `@radix-ui/react-avatar` ~1.1.0
- `@radix-ui/react-dialog` ~1.1.1
- `@radix-ui/react-dropdown-menu` ~2.1.1
- `@radix-ui/react-label` ~2.1.0
- `@radix-ui/react-popover` ~1.1.1
- `@radix-ui/react-select` ~2.1.1
- `@radix-ui/react-separator` ~1.1.0
- `@radix-ui/react-slot` ~1.1.0
- `@radix-ui/react-switch` ~1.2.6
- `@radix-ui/react-tabs` ~1.1.13

**Styling:**
- `tailwindcss` ~3.4.4 (dev) — Utility-first CSS framework
- `tailwindcss-animate` ~1.0.7 (dev) — Animation plugin
- `class-variance-authority` ~0.7.0 — Variant-based component styling
- `clsx` ~2.1.1 — Conditional class merging
- `tailwind-merge` ~2.4.0 — Tailwind class deduplication

**Drag & Drop (for Kanban board, phases 7-8):**
- `@dnd-kit/core` ~6.1.0 — Core DnD primitives
- `@dnd-kit/sortable` ~8.0.0 — Sortable list/column support
- `@dnd-kit/utilities` ~3.2.2 — DnD utility helpers

**Forms & Validation:**
- `react-hook-form` ~7.51.5 — Form state management
- `@hookform/resolvers` ~3.6.0 — Validation resolver bridge (Zod)
- `zod` ~3.23.8 — Schema validation

**File Storage:**
- `@vercel/blob` ~0.23.4 — Vercel Blob storage for file uploads

**Notifications:**
- `sonner` ~1.5.0 — Toast notification system

**Utilities:**
- `date-fns` ~3.6.0 — Date formatting and manipulation
- `lucide-react` ~0.424.0 — Icon library

**Linting (dev):**
- `eslint` ~8.57.0
- `eslint-config-next` ~14.2.5

**Type Definitions (dev):**
- `@types/bcryptjs` ~2.4.6
- `@types/node` ~20.14.9
- `@types/react` ~18.3.3
- `@types/react-dom` ~18.3.0

## Configuration

**TypeScript** (`tsconfig.json`):
- Strict mode: `true`
- Path alias: `@/*` → `./src/*`
- Module resolution: `bundler`
- Incremental compilation: enabled
- Target: ESNext modules, JSX preserve

**Tailwind CSS** (`tailwind.config.ts`):
- Dark mode: class-based (`darkMode: ["class"]`)
- Content: `src/pages/**`, `src/components/**`, `src/app/**`
- CSS variables for theming (HSL-based) defined in `src/app/globals.css`
- Base color: slate
- Plugin: `tailwindcss-animate`

**shadcn/ui** (`components.json`):
- Style: default
- RSC support: enabled
- Base color: slate
- CSS variables: enabled
- Aliases: `@/components`, `@/lib/utils`

**ESLint** (`.eslintrc.json`):
- Extends: `next/core-web-vitals` only

**PostCSS** (`postcss.config.js`):
- Plugins: tailwindcss, autoprefixer

**Next.js** (`next.config.mjs`):
- Image optimization: remote patterns for `**.public.blob.vercel-storage.com`

## Installed shadcn/ui Components

14 components in `src/components/ui/`:

| Component | File | Purpose |
|-----------|------|---------|
| avatar | `avatar.tsx` | User avatar display |
| badge | `badge.tsx` | Status badges |
| button | `button.tsx` | Action buttons |
| card | `card.tsx` | Content containers |
| dialog | `dialog.tsx` | Modal dialogs |
| dropdown-menu | `dropdown-menu.tsx` | Context/action menus |
| input | `input.tsx` | Text inputs |
| label | `label.tsx` | Form labels |
| select | `select.tsx` | Dropdown selects |
| separator | `separator.tsx` | Visual divers |
| sonner | `sonner.tsx` | Toast notifications (sonner integration) |
| switch | `switch.tsx` | Toggle switches |
| tabs | `tabs.tsx` | Tab navigation |
| textarea | `textarea.tsx` | Multi-line text inputs |

## Package Versions Summary

| Category | Package | Version | Type |
|----------|---------|---------|------|
| Framework | `next` | ~14.2.18 | dep |
| UI Library | `react` | ~18.3.1 | dep |
| Auth | `next-auth` | ~5.0.0-beta.22 | dep |
| Auth Adapter | `@auth/prisma-adapter` | ~2.11.1 | dep |
| Password Hash | `bcryptjs` | ~2.4.3 | dep |
| ORM | `@prisma/client` | ~5.14.0 | dep |
| ORM CLI | `prisma` | ~5.14.0 | dev |
| Validation | `zod` | ~3.23.8 | dep |
| Forms | `react-hook-form` | ~7.51.5 | dep |
| Form Resolvers | `@hookform/resolvers` | ~3.6.0 | dep |
| Drag & Drop | `@dnd-kit/core` | ~6.1.0 | dep |
| Drag & Drop | `@dnd-kit/sortable` | ~8.0.0 | dep |
| Drag & Drop | `@dnd-kit/utilities` | ~3.2.2 | dep |
| File Upload | `@vercel/blob` | ~0.23.4 | dep |
| Toasts | `sonner` | ~1.5.0 | dep |
| Icons | `lucide-react` | ~0.424.0 | dep |
| Date Utils | `date-fns` | ~3.6.0 | dep |
| CSS Classes | `clsx` | ~2.1.1 | dep |
| CSS Merge | `tailwind-merge` | ~2.4.0 | dep |
| CSS Variants | `class-variance-authority` | ~0.7.0 | dep |
| CSS | `tailwindcss` | ~3.4.4 | dev |
| CSS Animations | `tailwindcss-animate` | ~1.0.7 | dev |
| CSS | `autoprefixer` | ~10.4.19 | dev |
| CSS | `postcss` | ~8.4.39 | dev |
| TypeScript | `typescript` | ~5.5.3 | dev |
| Linting | `eslint` | ~8.57.0 | dev |
| Linting | `eslint-config-next` | ~14.2.5 | dev |

---

*Stack analysis: 2026-03-26*
