# Brian — Freelance Board System

## What This Is

A Trello-like project management system for freelancers and small teams. Enables tracking work requests through a Kanban board with role-based permissions (Owner/Worker/Client), hour logging, lifecycle tracking, and approval workflows.

## Core Value

Freelancers can track and bill every unit of work through a structured workflow: creation → planning → execution → review → approval → completion with full audit trail.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **AUTH-01**: Email/password authentication — implemented with NextAuth v5
- ✓ **AUTH-02**: Session persistence — via JWT tokens
- ✓ **PROJ-01**: Create/read projects — owner can CRUD, members view
- ✓ **PROJ-02**: Project status (active/archived) — archived generates JSON snapshot
- ✓ **UI-01**: Dashboard with project list — filtered by status
- ✓ **UI-02**: Project detail page — displays board structure

### Active

<!-- Current scope. Building toward these. -->

- [ ] **PROJ-03**: Project settings (requireEstimateBeforeStart, estimateRequired)
- [ ] **PROJ-04**: Member management (add/remove workers and clients)
- [ ] **BOARD-01**: Kanban board with columns (CRUD via JSON)
- [ ] **BOARD-02**: Drag & drop cards between columns using @dnd-kit
- [ ] **REQ-01**: Create/read/update/delete requests (cards)
- [ ] **REQ-02**: Request status workflow (backlog → in_progress → review → done/blocked/waiting)
- [ ] **REQ-03**: Assign worker to request
- [ ] **REQ-04**: Estimated hours tracking
- [ ] **REQ-05**: Logged hours tracking
- [ ] **REQ-06**: Request lifecycle log (append-only JSON)
- [ ] **REQ-07**: Request comments
- [ ] **REQ-08**: Request attachments
- [ ] **APPR-01**: Owner approval workflow
- [ ] **APPR-02**: Client approval workflow

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
- Next.js 14 with App Router (Server/Client Components)
- Prisma ORM with PostgreSQL
- NextAuth.js v5 (credentials provider, JWT)
- shadcn/ui components + Tailwind CSS v4
- @dnd-kit for drag & drop
- Zod for validation
- @vercel/blob for file uploads (planned)

**Current Implementation State:**
- Auth flow: login/register with credentials (NextAuth v5)
- Database: Prisma schema with User, Project, Request models
- UI: shadcn/ui components, dashboard, project list, project detail
- Role system defined in Prisma (OWNER, WORKER, CLIENT)

**User Research Themes:**
- Freelancers need billable hour tracking
- Clients want visibility into work progress
- Owners need control over who sees/does what

**Known Issues to Address:**
- Phases 6-20 not yet implemented (member management, board, requests, etc.)
- No API routes for full CRUD operations yet
- No test coverage established

## Constraints

- **[Tech Stack]**: Next.js 14 + Prisma + PostgreSQL — must use these exact technologies
- **[Time]**: MVP features prioritized; complex features deferred to v2+
- **[Deployment]**: Vercel target (requires compatible configuration)
- **[Authentication]**: Credentials only (email/password), OAuth deferred to v2+

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSON for board columns | Simplicity for MVP, schema flexibility | ✓ Good |
| JSON for lifecycle log | Append-only audit trail requirement | ✓ Good |
| Hard delete for requests | Cascade delete required for project deletion | ✓ Good |
| shadcn/ui component library | Rapid UI development, accessible components | ✓ Good |

---

*Last updated: 2026-03-26 after GSD project initialization*

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