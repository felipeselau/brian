# Roadmap: Brian — Freelance Board System

**Created:** 2026-03-26
**Core Value:** Freelancers can track and bill every unit of work through a structured workflow.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-10 (shipped 2026-03-27)
- 🚧 **v1.1 Polish & Quality** — Phases 11-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-10) — SHIPPED 2026-03-27</summary>

| Phase | Goal | Status | Completed |
|-------|------|--------|-----------|
| 1 | Setup & Auth Foundation | ✅ Complete | 2026-03-26 |
| 2 | Projects CRUD | ✅ Complete | 2026-03-26 |
| 3 | Member Management | ✅ Complete | 2026-03-26 |
| 4 | Kanban Board | ✅ Complete | 2026-03-26 |
| 5 | Requests CRUD | ✅ Complete | 2026-03-26 |
| 6 | Hours Tracking | ✅ Complete | 2026-03-26 |
| 7 | Lifecycle Log | ✅ Complete | 2026-03-26 |
| 8 | Comments & Attachments | ✅ Complete | 2026-03-26 |
| 9 | Approvals | ✅ Complete | 2026-03-26 |
| 10 | Business Rules | ✅ Complete | 2026-03-27 |

**Total:** 10 phases | 40 requirements | All complete

*Full phase details archived at: `.planning/milestones/v1.0-ROADMAP.md`*

</details>

### 🚧 v1.1 Polish & Quality (In Progress)

**Milestone Goal:** Improve UX polish, add test coverage, and update core dependencies to latest stable versions.

- ⚠️ **Phase 11: Dependency Upgrades** - Update Next.js to 16 and Prisma to 7 with zero regressions (Plan 1/2 complete, Plan 2/2 BLOCKED)
- [ ] **Phase 12: Loading & Empty States** - Add loading skeletons and helpful empty states throughout
- [ ] **Phase 13: Animations & Mobile** - Smooth transitions and mobile-responsive audit
- [ ] **Phase 14: E2E Testing & Error Handling** - Playwright tests and graceful error boundaries

## Phase Details

### Phase 11: Dependency Upgrades ⚠️ BLOCKED
**Goal**: App runs on latest stable dependencies with all features working
**Depends on**: Phase 10 (v1.0 complete)
**Requirements**: DEPS-01, DEPS-02, DEPS-03
**Success Criteria** (what must be TRUE):
  1. User can run `npm run dev` and use all features on Next.js 16
  2. User can perform all database operations (CRUD, relations) on Prisma 7
  3. User can run `npm run build` and deploy without dependency conflicts
  4. All existing functionality (auth, board, drag-drop, uploads) works unchanged
**Plans**: 2 plans
  - [x] Plan 11-01: Next.js 14→16 upgrade (complete)
  - [❌] Plan 11-02: Prisma 5→7 upgrade (BLOCKED - requires ESM migration)

**BLOCKER:** Prisma 7 requires ESM migration, new config system, and driver adapters.
Out of scope for atomic upgrade. Decision required on migration path.
See: `.planning/phases/11-dependency-upgrades/11-02-BLOCKER.md`

### Phase 12: Loading & Empty States
**Goal**: Users see appropriate feedback during loading and when no data exists
**Depends on**: Phase 11
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. User sees loading skeletons while dashboard loads (not blank screen)
  2. User sees loading skeletons while board/requests fetch
  3. User sees helpful empty state with CTA when no projects exist
  4. User sees helpful empty state with CTA when board has no requests
**Plans**: TBD
**UI hint**: yes

### Phase 13: Animations & Mobile
**Goal**: App feels polished with smooth animations and works well on mobile
**Depends on**: Phase 12
**Requirements**: UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User experiences smooth animations on drag-drop, modals, and transitions
  2. User can navigate and use all features on mobile viewport (375px)
  3. User can create/view/edit requests from mobile device
  4. Touch targets are appropriately sized (min 44px)
**Plans**: TBD
**UI hint**: yes

### Phase 14: E2E Testing & Error Handling
**Goal**: Critical user flows are tested and errors are handled gracefully
**Depends on**: Phase 13
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. E2E tests cover: login, create project, create request, drag card between columns
  2. User sees error boundary UI (not crash) when component throws
  3. User sees meaningful error message when API fails (not generic "Something went wrong")
  4. Tests can run in CI pipeline
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 10/10 | Complete | 2026-03-27 |
| 11. Dependency Upgrades | v1.1 | 1/2 | ⚠️ Blocked | - |
| 12. Loading & Empty States | v1.1 | 0/? | Not started | - |
| 13. Animations & Mobile | v1.1 | 0/? | Not started | - |
| 14. E2E Testing & Error Handling | v1.1 | 0/? | Not started | - |

---

## Roadmap Validation

- [x] All v1.1 requirements mapped to phases
- [x] Each requirement appears exactly once
- [x] Dependencies respected (deps → loading → animations → testing)
- [x] Coverage: 10 requirements across 4 phases

---

*Last updated: 2026-03-27*
