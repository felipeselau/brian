# Requirements: Brian — Freelance Board System

**Defined:** 2026-03-26
**Updated:** 2026-03-27
**Core Value:** Freelancers can track and bill every unit of work through a structured workflow: creation → planning → execution → review → approval → completion with full audit trail.

## v1.1 Requirements — Polish & Quality

**Goal:** Improve UX polish, add test coverage, and update core dependencies to latest stable versions.

### Dependency Updates

- [ ] **DEPS-01**: User can run app on Next.js 16 with all features working
- [ ] **DEPS-02**: User can run app on Prisma 7 with all database operations working
- [ ] **DEPS-03**: User can build and deploy without dependency conflicts

### UX Polish

- [ ] **UX-01**: User sees loading skeletons while data fetches (dashboard, board, requests)
- [ ] **UX-02**: User sees helpful empty states with CTAs when no data exists
- [ ] **UX-03**: User experiences smooth animations on drag-drop, modals, and transitions
- [ ] **UX-04**: User can use app comfortably on mobile devices (responsive audit)

### Testing & Quality

- [ ] **TEST-01**: User flows are tested E2E: login, create project, create request, drag card
- [ ] **TEST-02**: User sees graceful error boundaries instead of crashes
- [ ] **TEST-03**: User gets meaningful error messages on API failures

---

## v1.0 Requirements — MVP (✅ SHIPPED)

All v1.0 requirements completed 2026-03-27.

<details>
<summary>View v1.0 requirements (40 complete)</summary>

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User session persists across browser refresh (JWT)
- [x] **AUTH-03**: User can log out from any page

### Projects

- [x] **PROJ-01**: Owner can create projects with title, description, dates
- [x] **PROJ-02**: Owner can view project list
- [x] **PROJ-03**: Owner can view project details
- [x] **PROJ-04**: Project supports active/archived status
- [x] **PROJ-05**: Project settings (requireEstimateBeforeStart, estimateRequired)
- [x] **PROJ-06**: Owner can edit project
- [x] **PROJ-07**: Owner can delete project (cascades requests)

### Member Management

- [x] **MEMB-01**: Owner can add workers to project
- [x] **MEMB-02**: Owner can add clients to project
- [x] **MEMB-03**: Owner can remove members from project
- [x] **MEMB-04**: Members can view assigned project
- [x] **MEMB-05**: Worker can estimate hours
- [x] **MEMB-06**: Worker can log hours on assigned requests
- [x] **MEMB-07**: Client can create requests in project

### Board

- [x] **BOARD-01**: Display Kanban board with columns (from JSON)
- [x] **BOARD-02**: Add/remove columns
- [x] **BOARD-03**: Reorder columns
- [x] **BOARD-04**: Drag & drop cards between columns (@dnd-kit)
- [x] **BOARD-05**: Create request from board (quick add)

### Requests (Cards)

- [x] **REQ-01**: Display request cards in columns
- [x] **REQ-02**: Create request with title, description
- [x] **REQ-03**: Edit request details
- [x] **REQ-04**: Delete request (hard delete by owner)
- [x] **REQ-05**: Request status workflow (backlog → in_progress → review → done/blocked/waiting)
- [x] **REQ-06**: Assign worker to request
- [x] **REQ-07**: Estimated hours field
- [x] **REQ-08**: Logged hours field
- [x] **REQ-09**: Lifecycle log (append-only JSON tracking all changes)

### Comments & Attachments

- [x] **COMM-01**: Add comments to request
- [x] **COMM-02**: View comment history
- [x] **ATT-01**: Upload attachments to request
- [x] **ATT-02**: View/download attachments
- [x] **ATT-03**: Delete attachments

### Approvals

- [x] **APPR-01**: Request moves to "review" when worker marks done
- [x] **APPR-02**: Owner can approve/reject request
- [x] **APPR-03**: Client can approve/reject request (after owner)
- [x] **APPR-04**: Request moves to "done" after all approvals

### Dashboard

- [x] **DASH-01**: Display project list on dashboard
- [x] **DASH-02**: Filter projects by status (active/archived)

</details>

---

## v2 Requirements (Future)

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-04**: User can reset password via email link
- **AUTH-05**: Email verification after signup
- **AUTH-06**: OAuth login (Google, GitHub)
- **AUTH-07**: Two-factor authentication

### Notifications

- **NOTF-01**: In-app notifications for status changes
- **NOTF-02**: Email notifications for approvals requested

### Advanced Features

- **ADVN-01**: Real-time board updates (WebSocket)
- **ADVN-02**: Custom workflow statuses
- **ADVN-03**: Export project data (PDF/CSV)
- **ADVN-04**: Basic invoicing from hours logged
- **PROJ-08**: Archival generates JSON snapshot

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complex automations | GSD workflow features deferred |
| Customizable workflows | Fixed status workflow for MVP |
| External integrations | No third-party integrations in MVP |
| Complete financial system | Hours tracking for reference only |
| AI features | AI-assisted planning deferred |
| Real-time collaboration | WebSocket/polling deferred |
| Mobile app | Web-only initially |
| OAuth login | Email/password sufficient for v1 |
| Unit tests | Focus on E2E for v1.1, unit tests later |

## Traceability

### v1.1 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPS-01 | Phase 11 | Pending |
| DEPS-02 | Phase 11 | Pending |
| DEPS-03 | Phase 11 | Pending |
| UX-01 | Phase 12 | Pending |
| UX-02 | Phase 12 | Pending |
| UX-03 | Phase 13 | Pending |
| UX-04 | Phase 13 | Pending |
| TEST-01 | Phase 14 | Pending |
| TEST-02 | Phase 14 | Pending |
| TEST-03 | Phase 14 | Pending |

### v1.0 Traceability (Archived)

<details>
<summary>View v1.0 traceability</summary>

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | ✅ Complete |
| AUTH-02 | Phase 1 | ✅ Complete |
| AUTH-03 | Phase 1 | ✅ Complete |
| PROJ-01 | Phase 2 | ✅ Complete |
| PROJ-02 | Phase 2 | ✅ Complete |
| PROJ-03 | Phase 2 | ✅ Complete |
| PROJ-04 | Phase 2 | ✅ Complete |
| PROJ-05 | Phase 10 | ✅ Complete |
| PROJ-06 | Phase 2 | ✅ Complete |
| PROJ-07 | Phase 2 | ✅ Complete |
| DASH-01 | Phase 2 | ✅ Complete |
| DASH-02 | Phase 2 | ✅ Complete |
| MEMB-01 | Phase 3 | ✅ Complete |
| MEMB-02 | Phase 3 | ✅ Complete |
| MEMB-03 | Phase 3 | ✅ Complete |
| MEMB-04 | Phase 3 | ✅ Complete |
| MEMB-05 | Phase 3 | ✅ Complete |
| MEMB-06 | Phase 3 | ✅ Complete |
| MEMB-07 | Phase 3 | ✅ Complete |
| BOARD-01 | Phase 4 | ✅ Complete |
| BOARD-02 | Phase 4 | ✅ Complete |
| BOARD-03 | Phase 4 | ✅ Complete |
| BOARD-04 | Phase 4 | ✅ Complete |
| BOARD-05 | Phase 4 | ✅ Complete |
| REQ-01 | Phase 5 | ✅ Complete |
| REQ-02 | Phase 5 | ✅ Complete |
| REQ-03 | Phase 5 | ✅ Complete |
| REQ-04 | Phase 5 | ✅ Complete |
| REQ-05 | Phase 5 | ✅ Complete |
| REQ-06 | Phase 6 | ✅ Complete |
| REQ-07 | Phase 6 | ✅ Complete |
| REQ-08 | Phase 6 | ✅ Complete |
| REQ-09 | Phase 7 | ✅ Complete |
| COMM-01 | Phase 8 | ✅ Complete |
| COMM-02 | Phase 8 | ✅ Complete |
| ATT-01 | Phase 8 | ✅ Complete |
| ATT-02 | Phase 8 | ✅ Complete |
| ATT-03 | Phase 8 | ✅ Complete |
| APPR-01 | Phase 9 | ✅ Complete |
| APPR-02 | Phase 9 | ✅ Complete |
| APPR-03 | Phase 9 | ✅ Complete |
| APPR-04 | Phase 9 | ✅ Complete |

</details>

**Coverage:**
- v1.1 requirements: 10 total (0 complete)
- v1.0 requirements: 40 total (40 complete ✅)

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-27 after v1.1 milestone start*
