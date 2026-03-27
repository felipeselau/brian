# Phase 1: Setup & Auth Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

User authentication flow — email/password register, login, and session persistence.

</domain>

<decisions>
## Implementation Decisions

### Authentication Implementation
- **D-01:** NextAuth v5 com Credentials Provider (implementado em `src/lib/auth.ts`)
- **D-02:** JWT session strategy (strategy: "jwt" em auth.ts)
- **D-03:** Session inclui user.id e user.role no token (via jwt callback)

### Registration Flow
- **D-04:** Register page em `src/app/(auth)/register/page.tsx`
- **D-05:** Hashed password com bcrypt antes de salvar no banco

### Login/Logout Pages
- **D-06:** Login page em `src/app/(auth)/login/page.tsx`
- **D-07:** Redirect pós-logout para /login (configurado em pages.signOut)

### User Schema
- **D-08:** Role definido como enum (OWNER, WORKER, CLIENT) — schema Prisma

### Agent's Discretion
[Nenhum — todas decisões já tomadas no código existente]

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication
- `src/lib/auth.ts` — NextAuth v5 configuration com credentials provider
- `src/app/(auth)/login/page.tsx` — Login form UI
- `src/app/(auth)/register/page.tsx` — Registration form UI
- `prisma/schema.prisma` — User model com role enum

### Files
- `.planning/PROJECT.md` — Core value e requirements
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03 definitions

[Se não há especificações externas — requirements totalmente capturados em decisões acima]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- NextAuth v5 handler em `src/lib/auth.ts`
- LoginForm component em `src/components/auth/LoginForm.tsx`
- RegisterForm component em `src/components/auth/RegisterForm.tsx`

### Established Patterns
- Server Components para páginas públicas (auth group)
- Client Components para forms de autenticação
- shadcn/ui Input, Button components para formulários

### Integration Points
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route
- Session verificada via `auth()` export de src/lib/auth.ts

</code_context>

<specifics>
## Specific Ideas

[Não há necessidades específicas — abordagem padrão NextAuth v5]

</specifics>

<deferred>
## Deferred Ideas

[Ideias que surgiram mas pertencem a outras fases.]

### Reviewed (not folded)
[Nenhum — discussão permaneceu dentro do escopo da fase]

[Nenhuma — discussão ficou dentro do escopo da fase]

</deferred>

---

*Phase: 01-setup-auth-foundation*
*Context gathered: 2026-03-26*