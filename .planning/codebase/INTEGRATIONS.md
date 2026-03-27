# INTEGRATIONS.md — External Integrations

**Generated:** 2026-03-27
**Focus:** External services and APIs

## Database

### PostgreSQL
- **Prisma ORM** connects to PostgreSQL database
- **Schema:** `prisma/schema.prisma` defines all models
- **Models:** User, Project, ProjectMember, Request, Comment, Attachment

### Environment
```DATABASE_URL=postgresql://user:pass@host:5432/db```

---

## Authentication

### NextAuth v5
- **Provider:** Credentials (email/password)
- **Adapter:** PrismaAdapter
- **Session Strategy:** JWT
- **Configuration:** `src/lib/auth.ts`

### User Roles (enum)
- OWNER
- WORKER
- CLIENT

---

## File Storage

### @vercel/blob (planned)
- Intended for file attachments
- Currently using URL-based attachments in MVP
- No actual upload implementation yet

---

## API Routes Structure

```
/api/
├── auth/
│   └── [...nextauth]/route.ts
├── projects/
│   ├── route.ts (GET, POST)
│   └── [projectId]/
│       ├── route.ts (GET, PATCH, DELETE)
│       ├── members/
│       │   └── route.ts
│       ├── board/
│       │   └── route.ts
│       └── requests/
│           ├── route.ts
│           └── [requestId]/
│               ├── route.ts
│               ├── approve/
│               │   └── route.ts
│               ├── reject/
│               │   └── route.ts
│               ├── comments/
│               │   └── route.ts
│               └── attachments/
│                   └── route.ts
└── users/
    └── route.ts
```

---

## Environment Configuration

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=secret
NEXTAUTH_URL=http://localhost:3000
```

All secrets stored in `.env` (not committed to git).