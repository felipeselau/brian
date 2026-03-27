# Phase 7: Lifecycle Log - Context

**Gathered:** 2026-03-27
**Status:** Complete (verified retroactively)

<domain>
## Phase Boundary

Immutable audit trail for all request changes.

</domain>

<decisions>
## Implementation Decisions

### Data Model
- **D-01:** `lifecycleLog` — JSON array stored on Request model
- **D-02:** Append-only pattern — never overwrite existing entries
- **D-03:** Each entry contains: `{ from, to, by, at }`

### Log Triggers
- **D-04:** Status changes logged automatically in PATCH handlers
- **D-05:** Both `/requests/[id]` and `/board` routes log changes
- **D-06:** User ID and timestamp captured on every transition

### Display
- **D-07:** Lifecycle visible in request detail modal
- **D-08:** Chronological display of all transitions

</decisions>

<canonical_refs>
## Canonical References

- `prisma/schema.prisma` — Request.lifecycleLog JSON field
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` — appends log on PATCH
- `src/app/api/projects/[projectId]/board/route.ts` — appends log on card move
- `src/types/index.ts` — LifecycleLogEntry interface

</canonical_refs>

---

*Phase: 07-lifecycle-log*
*Context gathered: 2026-03-27 (retroactive)*
