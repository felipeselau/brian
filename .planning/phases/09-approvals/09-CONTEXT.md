# Phase 9: Approvals - Context

**Gathered:** 2026-03-27
**Status:** Complete

<domain>
## Phase Boundary

Owner and client approval workflow for requests in REVIEW status.

</domain>

<decisions>
## Implementation Decisions

### Approval Workflow
- **D-01:** Request moves to REVIEW when worker marks as Done
- **D-02:** Owner must approve first, then client
- **D-03:** Both approvals = request status DONE
- **D-04:** Owner rejection resets to IN_PROGRESS

### API Routes
- **D-05:** POST /api/projects/[id]/requests/[id]/approve
- **D-06:** POST /api/projects/[id]/requests/[id]/reject
- **D-07:** Approval stored in JSON field (owner/client boolean)

### UI Components
- **D-08:** ApprovalsSection with approve/reject buttons
- **D-09:** Request detail page with Approvals tab

</decisions>

<canonical_refs>
## Canonical References

- `src/app/api/projects/[projectId]/requests/[requestId]/approve/route.ts`
- `src/app/api/projects/[projectId]/requests/[requestId]/reject/route.ts`
- `src/app/(dashboard)/projects/[projectId]/requests/[requestId]/approvals-section.tsx`

</canonical_refs>

---

*Phase: 09-approvals*
*Context gathered: 2026-03-27*