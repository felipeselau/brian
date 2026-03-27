# Roadmap: Brian — Freelance Board System

**Created:** 2026-03-26
**Core Value:** Freelancers can track and bill every unit of work through a structured workflow.

## Overview

| Phase | Goal | Requirements | Success Criteria |
|-------|------|--------------|------------------|
| 1 | Setup & Auth Foundation | AUTH-01, AUTH-02, AUTH-03, Setup files | User can register, login, logout |
| 2 | Projects CRUD | PROJ-01, PROJ-02, PROJ-03, PROJ-04, DASH-01, DASH-02 | Full project CRUD from UI |
| 3 | Member Management | MEMB-01 → MEMB-07 | Owner manages members, workers/clients added |
| 4 | Kanban Board | BOARD-01 → BOARD-05 | Drag & drop working board |
| 5 | Requests CRUD | REQ-01 → REQ-05 | Full request lifecycle |
| 6 | Hours Tracking | REQ-06, REQ-07, REQ-08 | Worker estimates & logs hours |
| 7 | Lifecycle Log | REQ-09 | All changes tracked in audit log |
| 8 | Comments & Attachments | COMM-01, COMM-02, ATT-01 → ATT-03 | Full collaboration features |
| 9 | Approvals | APPR-01 → APPR-04 | Owner/client approval workflow |
| 10 | Business Rules | Settings enforcement | Estimates required, workflow enforced |

**Total:** 10 phases | 40 pending requirements

---

## Phase Details

### Phase 1: Setup & Auth Foundation
**Goal:** User can register, login, and maintain session

**Requirements:**
- AUTH-01: Sign up with email/password
- AUTH-02: Session persists across browser refresh
- AUTH-03: Log out from any page

**Success Criteria:**
1. User can create account via register form
2. User can log in with email/password
3. User session persists after browser refresh
4. User can log out from any page

---

### Phase 2: Projects CRUD
**Goal:** Full project management from UI

**Requirements:**
- PROJ-01: Create projects with title, description, dates
- PROJ-02: View project list
- PROJ-03: View project details  
- PROJ-04: Project status (active/archived)
- DASH-01: Display project list on dashboard
- DASH-02: Filter projects by status

**Success Criteria:**
1. Owner can create new project via form
2. Dashboard shows all user's projects
3. Project detail page loads with all info
4. Projects can be filtered by status
5. Owner can archive/delete projects

---

### Phase 3: Member Management
**Goal:** Owner can manage project members

**Requirements:**
- MEMB-01: Add workers to project
- MEMB-02: Add clients to project
- MEMB-03: Remove members from project
- MEMB-04: Members can view assigned project
- MEMB-05: Worker can estimate hours
- MEMB-06: Worker can log hours on assigned requests
- MEMB-07: Client can create requests in project

**Success Criteria:**
1. Owner can invite worker via email
2. Owner can invite client via email
3. Owner can remove members
4. Worker sees assigned project in their list
5. Client can create requests in backlog

---

### Phase 4: Kanban Board
**Goal:** Visual drag-and-drop board

**Requirements:**
- BOARD-01: Display Kanban board with columns
- BOARD-02: Add/remove columns
- BOARD-03: Reorder columns
- BOARD-04: Drag & drop cards between columns
- BOARD-05: Quick create request from board

**Success Criteria:**
1. Board displays columns from JSON config
2. Cards render in correct columns
3. Drag & drop works smoothly (@dnd-kit)
4. Column reordering persists
5. Quick add creates request in backlog

---

### Phase 5: Requests CRUD
**Goal:** Full request/card lifecycle

**Requirements:**
- REQ-01: Display request cards in columns
- REQ-02: Create request with title, description
- REQ-03: Edit request details
- REQ-04: Delete request
- REQ-05: Status workflow transitions

**Success Criteria:**
1. Requests load from database into columns
2. Create modal captures title, description
3. Edit modal updates all fields
4. Delete removes request (owner only)
5. Status changes update board automatically

---

### Phase 6: Hours Tracking
**Goal:** Worker estimates and logs effort

**Requirements:**
- REQ-06: Assign worker to request
- REQ-07: Estimated hours field
- REQ-08: Logged hours field

**Success Criteria:**
1. Worker can be assigned to request
2. Worker enters estimated hours before starting
3. Worker logs actual hours worked
4. Hours display on card and in modal

---

### Phase 7: Lifecycle Log
**Goal:** Complete audit trail for every change

**Requirements:**
- REQ-09: Lifecycle log (append-only JSON)

**Success Criteria:**
1. Every status change logged with user, timestamp
2. Every assignment change logged
3. Every hour update logged
4. Lifecycle displays in request modal
5. Log is immutable (append-only)

---

### Phase 8: Collaboration Features
**Goal:** Team communication on requests

**Requirements:**
- COMM-01: Add comments to request
- COMM-02: View comment history
- ATT-01: Upload attachments
- ATT-02: View/download attachments
- ATT-03: Delete attachments

**Success Criteria:**
1. Users can add comments to any request
2. Comments appear in chronological order
3. Files upload and store correctly
4. Attachments downloadable
5. Users can delete own comments/attachments

---

### Phase 9: Approval Workflow
**Goal:** Owner and client must approve before completion

**Requirements:**
- APPR-01: Request moves to review when worker marks done
- APPR-02: Owner can approve/reject
- APPR-03: Client can approve/reject
- APPR-04: Request moves to done after all approvals

**Success Criteria:**
1. Marking request "done" moves to review
2. Owner sees pending approvals
3. Client sees pending approvals after owner
4. Approval/rejection updates lifecycle log
5. Fully approved requests show in "done"

---

### Phase 10: Business Rules & Settings
**Goal:** Enforce project settings and workflow rules

**Requirements:**
- Project settings enforcement
- requireEstimateBeforeStart validation
- estimateRequired validation

**Success Criteria:**
1. Project settings persist to database
2. Cannot start work without estimate (if required)
3. Cannot move card without estimate (if required)
4. Settings UI accessible from project

---

## Roadmap Validation

- [x] All v1 requirements mapped to phases
- [x] Each requirement appears exactly once
- [x] Dependencies respected (auth → projects → board → requests)
- [x] Phase count matches granularity (coarse)
- [x] Coverage: 40 pending requirements across 10 phases