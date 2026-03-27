# Phase 6: Hours Tracking - Context

**Gathered:** 2026-03-27
**Status:** Complete (verified retroactively)

<domain>
## Phase Boundary

Worker estimation and time logging for requests.

</domain>

<decisions>
## Implementation Decisions

### Data Model
- **D-01:** `estimatedHours` — nullable decimal for worker estimates
- **D-02:** `loggedHours` — decimal defaulting to 0 for actual time
- **D-03:** `assignedToId` — foreign key to User for worker assignment

### UI Integration
- **D-04:** Hours displayed on request cards in board
- **D-05:** Hours editable in request detail/modal
- **D-06:** Workers can update their logged hours

</decisions>

<canonical_refs>
## Canonical References

- `prisma/schema.prisma` — Request model with estimatedHours, loggedHours
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` — PATCH updates hours
- `src/components/board/request-card.tsx` — displays hours on card

</canonical_refs>

---

*Phase: 06-hours-tracking*
*Context gathered: 2026-03-27 (retroactive)*
