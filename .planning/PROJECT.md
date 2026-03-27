# Brian — Freelance Board System

## What This Is

A Trello-like project management system for freelancers and small teams. Enables tracking work requests through a Kanban board with role-based permissions (Owner/Worker/Client), hour logging, lifecycle tracking, and approval workflows.

## Core Value

Freelancers can track and bill every unit of work through a structured workflow: creation → planning → execution → review → approval → completion with full audit trail.

## Current Milestone: v1.1 Polish & Quality

**Goal:** Improve UX polish, add test coverage, and update core dependencies to latest stable versions.

**Target features:**
- Dependency updates (Next.js 14→16, Prisma 5→7)
- Loading states, empty states, animations
- Mobile responsive audit & fixes
- E2E tests with Playwright
- Error boundaries for graceful failures

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **AUTH-01**: Email/password authentication — implemented with NextAuth v5
- ✓ **AUTH-02**: Session persistence — via JWT tokens
- ✓ **PROJ-01**: Create/read projects — owner can CRUD, members view
- ✓ **PROJ-02**: Project status (active/archived) — archived generates JSON snapshot
- ✓ **PROJ-03**: Project settings (requireEstimateBeforeStart, estimateRequired) — Phase 10
- ✓ **PROJ-04**: Member management (add/remove workers and clients) — Phase 3
- ✓ **UI-01**: Dashboard with project list — filtered by status
- ✓ **UI-02**: Project detail page — displays board structure
- ✓ **BOARD-01**: Kanban board with columns (CRUD via JSON) — Phase 4
- ✓ **BOARD-02**: Drag & drop cards between columns using @dnd-kit — Phase 4
- ✓ **REQ-01**: Create/read/update/delete requests (cards) — Phase 5
- ✓ **REQ-02**: Request status workflow (backlog → in_progress → review → done/blocked/waiting) — Phase 5
- ✓ **REQ-03**: Assign worker to request — Phase 5
- ✓ **REQ-04**: Estimated hours tracking — Phase 6
- ✓ **REQ-05**: Logged hours tracking — Phase 6
- ✓ **REQ-06**: Request lifecycle log (append-only JSON) — Phase 7
- ✓ **REQ-07**: Request comments — Phase 8
- ✓ **REQ-08**: Request attachments — Phase 8
- ✓ **APPR-01**: Owner approval workflow — Phase 9
- ✓ **APPR-02**: Client approval workflow — Phase 9

### Active

<!-- Current scope. Building toward these. v1.1 requirements will be defined in REQUIREMENTS.md -->

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Complex automations] — GSD workflow automation features deferred
- [Customizable workflows] — Fixed status workflow for MVP simplicity
- [External integrations] — No third-party integrations in MVP
- [Complete financial system] — Hours tracking for reference only, no invoicing in MVP
- [AI features] — AI-assisted planning/summarization deferred
- [Real-time collaboration] — WebSocket/polling for live updates deferred
- [Mobile app] — Web-only initially

## Context

**Technical Environment:**
- Next.js 14.2 with App Router (Server/Client Components) — upgrading to 16.x
- Prisma 5.14 ORM with PostgreSQL — upgrading to 7.x
- NextAuth.js v5 (credentials provider, JWT)
- shadcn/ui components + Tailwind CSS v4
- @dnd-kit for drag & drop
- Zod for validation
- @vercel/blob for file uploads

**Current Implementation State (v1.0 complete):**
- Auth flow: login/register with credentials (NextAuth v5)
- Database: Prisma schema with User, Project, ProjectMember, Request models
- UI: Full Kanban board with drag-and-drop, request modals, comments, attachments
- Role system: OWNER, WORKER, CLIENT with permission enforcement
- Hours tracking: estimated and logged hours
- Lifecycle log: append-only audit trail
- Approvals: Owner and client approval workflows

**Known Issues to Address (v1.1):**
- No test coverage established
- Loading states missing in key areas
- Mobile responsiveness needs audit
- Dependencies need major version updates

## Constraints

- **[Tech Stack]**: Next.js 16 + Prisma 7 + PostgreSQL — upgrading core dependencies
- **[Time]**: Polish and quality focus; new features deferred to v2+
- **[Deployment]**: Vercel target (requires compatible configuration)
- **[Authentication]**: Credentials only (email/password), OAuth deferred to v2+

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSON for board columns | Simplicity for MVP, schema flexibility | ✓ Good |
| JSON for lifecycle log | Append-only audit trail requirement | ✓ Good |
| Hard delete for requests | Cascade delete required for project deletion | ✓ Good |
| shadcn/ui component library | Rapid UI development, accessible components | ✓ Good |
| Next.js 14→16 upgrade | Stay current, performance improvements | Pending |
| Prisma 5→7 upgrade | New features, better performance | Pending |
| Playwright for E2E | Industry standard, good DX | Pending |

---

*Last updated: 2026-03-27 after v1.1 milestone start*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state