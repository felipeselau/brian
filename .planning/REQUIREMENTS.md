# Requirements: Brian — Freelance Board System

**Defined:** 2026-03-26
**Core Value:** Freelancers can track and bill every unit of work through a structured workflow: creation → planning → execution → review → approval → completion with full audit trail.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User session persists across browser refresh (JWT)
- [x] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: Email verification after signup

### Projects

- [x] **PROJ-01**: Owner can create projects with title, description, dates
- [x] **PROJ-02**: Owner can view project list
- [x] **PROJ-03**: Owner can view project details
- [x] **PROJ-04**: Project supports active/archived status
- [ ] **PROJ-05**: Project settings (requireEstimateBeforeStart, estimateRequired)
- [ ] **PROJ-06**: Owner can edit project
- [ ] **PROJ-07**: Owner can delete project (cascades requests)
- [ ] **PROJ-08**: Archival generates JSON snapshot

### Member Management

- [ ] **MEMB-01**: Owner can add workers to project
- [ ] **MEMB-02**: Owner can add clients to project
- [ ] **MEMB-03**: Owner can remove members from project
- [ ] **MEMB-04**: Members can view assigned project
- [ ] **MEMB-05**: Worker can estimate hours
- [ ] **MEMB-06**: Worker can log hours on assigned requests
- [ ] **MEMB-07**: Client can create requests in project

### Board

- [ ] **BOARD-01**: Display Kanban board with columns (from JSON)
- [ ] **BOARD-02**: Add/remove columns
- [ ] **BOARD-03**: Reorder columns
- [ ] **BOARD-04**: Drag & drop cards between columns (@dnd-kit)
- [ ] **BOARD-05**: Create request from board (quick add)

### Requests (Cards)

- [x] **REQ-01**: Display request cards in columns
- [ ] **REQ-02**: Create request with title, description
- [ ] **REQ-03**: Edit request details
- [ ] **REQ-04**: Delete request (hard delete by owner)
- [ ] **REQ-05**: Request status workflow (backlog → in_progress → review → done/blocked/waiting)
- [ ] **REQ-06**: Assign worker to request
- [ ] **REQ-07**: Estimated hours field
- [ ] **REQ-08**: Logged hours field
- [ ] **REQ-09**: Lifecycle log (append-only JSON tracking all changes)

### Comments & Attachments

- [ ] **COMM-01**: Add comments to request
- [ ] **COMM-02**: View comment history
- [ ] **ATT-01**: Upload attachments to request
- [ ] **ATT-02**: View/download attachments
- [ ] **ATT-03**: Delete attachments

### Approvals

- [ ] **APPR-01**: Request moves to "review" when worker marks done
- [ ] **APPR-02**: Owner can approve/reject request
- [ ] **APPR-03**: Client can approve/reject request (after owner)
- [ ] **APPR-04**: Request moves to "done" after all approvals

### Dashboard

- [x] **DASH-01**: Display project list on dashboard
- [x] **DASH-02**: Filter projects by status (active/archived)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

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

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Setup | Complete |
| AUTH-02 | Setup | Complete |
| AUTH-03 | Setup | Complete |
| PROJ-01 | Projects | Complete |
| PROJ-02 | Projects | Complete |
| PROJ-03 | Projects | Complete |
| PROJ-04 | Projects | Complete |
| DASH-01 | UI Foundation | Complete |
| DASH-02 | UI Foundation | Complete |
| MEMB-01 | Phase 6 | Pending |
| MEMB-02 | Phase 6 | Pending |
| MEMB-03 | Phase 6 | Pending |
| MEMB-04 | Phase 6 | Pending |
| MEMB-05 | Phase 6 | Pending |
| MEMB-06 | Phase 6 | Pending |
| MEMB-07 | Phase 6 | Pending |
| BOARD-01 | Phase 7-8 | Pending |
| BOARD-02 | Phase 7-8 | Pending |
| BOARD-03 | Phase 7-8 | Pending |
| BOARD-04 | Phase 7-8 | Pending |
| BOARD-05 | Phase 7-8 | Pending |
| REQ-01 | Phase 9-10 | Pending |
| REQ-02 | Phase 9-10 | Pending |
| REQ-03 | Phase 9-10 | Pending |
| REQ-04 | Phase 9-10 | Pending |
| REQ-05 | Phase 9-10 | Pending |
| REQ-06 | Phase 9-10 | Pending |
| REQ-07 | Phase 9-10 | Pending |
| REQ-08 | Phase 9-10 | Pending |
| REQ-09 | Phase 9-10 | Pending |
| COMM-01 | Phase 11-12 | Pending |
| COMM-02 | Phase 11-12 | Pending |
| ATT-01 | Phase 11-12 | Pending |
| ATT-02 | Phase 11-12 | Pending |
| ATT-03 | Phase 11-12 | Pending |
| APPR-01 | Phase 13-15 | Pending |
| APPR-02 | Phase 13-15 | Pending |
| APPR-03 | Phase 13-15 | Pending |
| APPR-04 | Phase 13-15 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Completed: 15
- Pending: 40

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after GSD initialization from existing codebase*