# Phase 10: Business Rules — Execution Plan

**Created:** 2026-03-27
**Status:** Complete

## Goal

Enforce project settings (`requireEstimateBeforeStart`, `estimateRequired`) when moving cards on the Kanban board.

## Implementation Summary

### Backend Changes (`src/app/api/projects/[projectId]/board/route.ts`)

1. **Read project settings** from `request.project.settings` JSON field
2. **Validate `requireEstimateBeforeStart`**:
   - Trigger: Moving card TO `IN_PROGRESS` 
   - Condition: `estimatedHours === null`
   - Response: 400 with code `ESTIMATE_REQUIRED_BEFORE_START`
3. **Validate `estimateRequired`**:
   - Trigger: Moving card TO `DONE` or `REVIEW`
   - Condition: `estimatedHours === null`
   - Response: 400 with code `ESTIMATE_REQUIRED_FOR_COMPLETION`
4. **Added lifecycle logging** on status changes (was missing from board route)

### Frontend Changes (`src/components/board/kanban-board.tsx`)

1. **Parse error response** from API
2. **Handle specific error codes**:
   - `ESTIMATE_REQUIRED_BEFORE_START` → Toast with clear message
   - `ESTIMATE_REQUIRED_FOR_COMPLETION` → Toast with clear message
3. **Don't update local state** when move is rejected

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/projects/[projectId]/board/route.ts` | +40 lines — business rule validation, lifecycle logging |
| `src/components/board/kanban-board.tsx` | +15 lines — error handling with specific messages |

## Business Rules Matrix

| Setting | Blocked Transitions | Error Code |
|---------|---------------------|------------|
| `requireEstimateBeforeStart: true` | `* → IN_PROGRESS` (if no estimate) | `ESTIMATE_REQUIRED_BEFORE_START` |
| `estimateRequired: true` | `* → REVIEW` (if no estimate) | `ESTIMATE_REQUIRED_FOR_COMPLETION` |
| `estimateRequired: true` | `* → DONE` (if no estimate) | `ESTIMATE_REQUIRED_FOR_COMPLETION` |

## Testing Scenarios

1. **Scenario A**: Project with `requireEstimateBeforeStart: true`
   - Create request without estimate
   - Try to drag to In Progress → Should show error toast
   - Add estimate → Drag should work

2. **Scenario B**: Project with `estimateRequired: true`
   - Create request without estimate
   - Drag to In Progress → Should work
   - Try to drag to Review → Should show error toast
   - Add estimate → Drag should work

3. **Scenario C**: Project with both settings `true`
   - Cannot start OR finish without estimate

4. **Scenario D**: Project with both settings `false`
   - All transitions allowed (default behavior)

## Success Criteria

- [x] Settings persist to database via settings form
- [x] Cannot start work without estimate (if required)
- [x] Cannot move card to Review/Done without estimate (if required)
- [x] Settings UI accessible from project settings page
- [x] User receives clear error message when move is blocked

---

*Phase 10 completed: 2026-03-27*
