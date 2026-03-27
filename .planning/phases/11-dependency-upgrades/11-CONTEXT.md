# Phase 11: Dependency Upgrades - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Update Next.js 14.2→16.2 and Prisma 5.14→7.5 with zero regressions to existing functionality. All v1.0 features must continue working after upgrades.

</domain>

<decisions>
## Implementation Decisions

### Upgrade Strategy
- **D-01:** Sequential approach — Next.js first, then Prisma
- **D-02:** Isolate problems by upgrading one major dependency at a time
- **D-03:** Build and test between each upgrade to catch issues early

### React Version
- **D-04:** Stay on React 18 — do not upgrade to React 19
- **D-05:** Rationale: @dnd-kit and other deps may not be React 19 compatible yet
- **D-06:** React 19 upgrade can be a future milestone if desired

### Tailwind CSS
- **D-07:** Keep Tailwind v3.4.4 — do not upgrade to v4
- **D-08:** Rationale: Tailwind 4 has breaking config changes, out of scope for this phase
- **D-09:** Tailwind upgrade can be a separate phase if desired

### Verification Approach
- **D-10:** Manual checklist for verification (no E2E tests yet)
- **D-11:** Critical paths to verify:
  - Authentication (login, register, logout, session persistence)
  - Project CRUD (create, read, update, delete, archive)
  - Board drag-and-drop (move cards between columns)
  - Requests (create, edit, status changes)
  - File uploads (attachments via Vercel Blob)
  - Hours tracking and lifecycle log
  - Comments and approvals
- **D-12:** Build must pass (`npm run build`)
- **D-13:** Type check must pass (`npx tsc --noEmit`)
- **D-14:** Lint must pass (`npm run lint`)

### Agent's Discretion
- Order of fixing breaking changes within each upgrade
- Whether to update related dependencies (e.g., eslint-config-next)
- Intermediate commits for each sub-step

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Migration Guides (fetch latest during research)
- Next.js 15 upgrade guide — https://nextjs.org/docs/app/building-your-application/upgrading/version-15
- Next.js 16 upgrade guide — https://nextjs.org/docs/app/building-your-application/upgrading/version-16
- Prisma 6 upgrade guide — https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-6
- Prisma 7 upgrade guide — https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

### Codebase Files
- `package.json` — Current dependency versions
- `src/lib/auth.ts` — NextAuth v5 configuration (may need updates)
- `src/lib/prisma.ts` — Prisma client singleton
- `prisma/schema.prisma` — Database schema
- `next.config.mjs` — Next.js configuration
- `tsconfig.json` — TypeScript configuration

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Versions
- Next.js: 14.2.18 → target 16.2.1
- Prisma: 5.14.0 → target 7.5.0
- React: 18.3.1 (keeping)
- next-auth: 5.0.0-beta.22 (may need compatible update)
- Tailwind: 3.4.4 (keeping)

### High-Risk Areas
- `src/lib/auth.ts` — NextAuth config with Prisma adapter
- 20+ API routes using `NextResponse` — check for API changes
- Server Components using `await auth()` — verify async patterns still work
- `@dnd-kit` integration — verify React 18 compatibility maintained

### Integration Points
- All API routes in `src/app/api/`
- Auth middleware in `src/middleware.ts` (if exists)
- Prisma client usage throughout `src/app/` and `src/components/`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow migration guides and fix breaking changes as documented.

</specifics>

<deferred>
## Deferred Ideas

- **React 19 upgrade** — Can be a future milestone when ecosystem is ready
- **Tailwind 4 upgrade** — Separate phase due to config migration effort
- **Automated tests during upgrade** — E2E tests come in Phase 14

</deferred>

---

*Phase: 11-dependency-upgrades*
*Context gathered: 2026-03-27*
