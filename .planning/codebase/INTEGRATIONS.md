# External Integrations

**Analysis Date:** 2026-03-26

## Database

### PostgreSQL

- **Provider:** PostgreSQL (self-hosted or managed)
- **ORM:** Prisma ~5.14.0 via `@prisma/client`
- **Schema:** `prisma/schema.prisma`
- **Client singleton:** `src/lib/prisma.ts` — Global PrismaClient singleton to prevent connection exhaustion in dev (hot reload pattern)
- **Migrations:** No migrations directory found — project uses `prisma db push` for schema synchronization

**Connection:**
- Configured via `DATABASE_URL` environment variable in `.env`
- Format: `postgresql://username:password@localhost:5432/brian_db?schema=public`

**Models (6 total):**

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Authentication & user profiles |
| `Project` | `projects` | Freelance project containers |
| `ProjectMember` | `project_members` | Project membership with roles |
| `Request` | `requests` | Tasks/requests within projects |
| `Comment` | `comments` | Comments on requests |
| `Attachment` | `attachments` | File attachments on requests |

**Enums:**
- `UserRole`: OWNER, WORKER, CLIENT
- `ProjectStatus`: ACTIVE, ARCHIVED
- `RequestStatus`: BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED, WAITING

**Indexes:**
- `Project`: `ownerId`, `status`
- `ProjectMember`: `projectId`, `userId`, unique composite `[projectId, userId]`
- `Request`: `projectId`, `assignedToId`, `status`
- `Comment`: `requestId`, `userId`
- `Attachment`: `requestId`

**Cascade rules:**
- Deleting a User cascades to owned Projects and created Requests
- Deleting a Project cascades to Members, Requests
- Deleting a Request cascades to Comments and Attachments

---

## Authentication

### NextAuth.js v5 (Beta)

- **Package:** `next-auth` ~5.0.0-beta.22
- **Adapter:** `@auth/prisma-adapter` ~2.11.1
- **Config:** `src/lib/auth.ts`
- **Route handler:** `src/app/api/auth/[...nextauth]/route.ts`
- **Custom pages:** `/login`, `/login` (sign-out redirect), `/login` (error)
- **Session strategy:** JWT (not database sessions)
- **Middleware:** `src/middleware.ts` — routes protected via NextAuth's `auth()` wrapper

**Providers:**

| Provider | Type | Status |
|----------|------|--------|
| Credentials | Email + Password | Configured & active |

**Authentication flow:**
1. User submits email/password to login form
2. `CredentialsProvider.authorize()` queries Prisma for user by email
3. `bcryptjs.compare()` validates password hash (salt rounds = 10)
4. On success, returns `{ id, email, name, role, image }`
5. JWT callback stores `id` and `role` in token
6. Session callback exposes `id` and `role` to `session.user`

**Type augmentation** (`src/types/auth.ts`):
- `Session.user` extended with `id: string` and `role: UserRole`
- `User` interface extended with `role: UserRole`
- `JWT` interface extended with `id: string` and `role: UserRole`

**Registration** (`src/app/api/auth/register/route.ts`):
- Zod-validated input: `name`, `email`, `password`, optional `role`
- Password hashed with `bcrypt.hash(password, 10)`
- Returns created user (without password)

**Middleware protection** (`src/middleware.ts`):
- Public routes: `/login`, `/register`
- All other non-API routes require authentication
- Logged-in users on public routes → redirect to `/dashboard`
- Unauthenticated users on protected routes → redirect to `/login`
- Matcher excludes: `api`, `_next/static`, `_next/image`, `favicon.ico`

---

## File Storage

### @vercel Blob

- **Package:** `@vercel/blob` ~0.23.4
- **Status:** Configured in dependencies, next.config image patterns set, but no upload implementation found
- **Env var:** `BLOB_READ_WRITE_TOKEN` (defined in `.env.example`)
- **Image config** (`next.config.mjs`): Remote patterns allow `**.public.blob.vercel-storage.com`
- **Attachment model** exists in Prisma schema with `url`, `name`, `size`, `type` fields
- **Attachment API route** exists at `src/app/api/projects/[projectId]/requests/[requestId]/attachments/route.ts`

**Current state:** Package installed and image CDN configured, but upload/download logic is not yet implemented. Attachment model stores references but actual file handling is pending.

---

## Email Services

**Not configured.** No email service (SendGrid, Resend, etc.) detected. No email-related dependencies in `package.json`.

---

## Third-Party APIs

**None detected.** No external API integrations beyond Vercel Blob. No HTTP client libraries (axios, etc.) — all API calls use Next.js native `fetch` through API routes.

---

## Environment Configuration

**File:** `.env` (present, gitignored)

**Required variables** (from `.env.example`):

| Variable | Purpose | Format |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET` | JWT signing secret | Random string (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Auth callback base URL | `http://localhost:3000` (dev) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob auth token | Vercel dashboard token |

**Secrets management:**
- `.env` file present and gitignored
- `.env.example` provides template without real values
- No secret management service detected (Vault, AWS SSM, etc.)

---

## API Routes Map

All endpoints are Next.js Route Handlers under `src/app/api/`:

```
/api/
├── auth/
│   ├── [...nextauth]/route.ts          # NextAuth handlers (GET, POST)
│   └── register/route.ts               # User registration (POST)
├── users/
│   └── route.ts                        # List users (GET)
└── projects/
    ├── route.ts                        # List/create projects (GET, POST)
    └── [projectId]/
        ├── route.ts                    # Get/update/delete project (GET, PATCH, DELETE)
        ├── members/
        │   └── route.ts                # Manage project members
        ├── board/
        │   └── route.ts                # Board/column operations
        └── requests/
            ├── route.ts                # List/create requests (GET, POST)
            └── [requestId]/
                ├── route.ts            # Get/update/delete request (GET, PATCH, DELETE)
                ├── approve/route.ts    # Approve request
                ├── reject/route.ts     # Reject request
                ├── comments/route.ts   # Manage comments
                └── attachments/route.ts # Manage attachments
```

---

## Integration Status Summary

| Integration | Status | Notes |
|-------------|--------|-------|
| PostgreSQL | Configured | Prisma schema defined, no migrations yet |
| NextAuth v5 | Configured | Credentials provider active, JWT sessions |
| Vercel Blob | Partial | Package installed, no upload logic |
| Email | Not configured | No email service present |
| External APIs | None | No third-party API integrations |
| Testing | Not configured | No test framework or test files |
| CI/CD | Not configured | No pipeline files (.github/workflows, etc.) |

---

*Integration audit: 2026-03-26*
