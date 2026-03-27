# Phase 10: Business Rules - Context

**Gathered:** 2026-03-27
**Status:** Complete

<domain>
## Phase Boundary

Project-level settings and business rules enforcement.

</domain>

<decisions>
## Implementation Decisions

### Project Settings
- **D-01:** requireEstimateBeforeStart - workers must estimate before starting
- **D-02:** estimateRequired - cannot complete without estimate

### Settings UI
- **D-03:** Dedicated /projects/[id]/settings page
- **D-04:** ProjectSettingsForm with all editable fields
- **D-05:** Only owner can edit settings

### Storage
- **D-06:** Settings stored in Project.settings JSON field

</decisions>

<canonical_refs>
## Canonical References

- `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
- `src/app/(dashboard)/projects/[projectId]/settings/settings-form.tsx`
- `prisma/schema.prisma` — Project.settings JSON field

</canonical_refs>

---

*Phase: 10-business-rules*
*Context gathered: 2026-03-27*