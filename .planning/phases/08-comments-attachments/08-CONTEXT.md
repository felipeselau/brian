# Phase 8: Comments & Attachments - Context

**Gathered:** 2026-03-27
**Status:** Complete

<domain>
## Phase Boundary

Team collaboration on requests via comments and file attachments.

</domain>

<decisions>
## Implementation Decisions

### Comments API
- **D-01:** GET /api/projects/[projectId]/requests/[requestId]/comments
- **D-02:** POST /api/projects/[projectId]/requests/[requestId]/comments
- **D-03:** DELETE project owner or comment author

### Attachments API  
- **D-04:** GET /api/projects/[projectId]/requests/[requestId]/attachments
- **D-05:** POST /api/projects/[projectId]/requests/[requestId]/attachments
- **D-06:** DELETE (project owner only for MVP)

### UI Components
- **D-07:** CommentsSection component with add/delete
- **D-08:** AttachmentsSection component with add/delete
- **D-09:** Request detail page with tabs (Details, Comments, Attachments)

### Agent's Discretion
- Attachments via URL for MVP (file upload comes later with @vercel/blob)

</decisions>

<canonical_refs>
## Canonical References

- `src/app/api/projects/[projectId]/requests/[requestId]/comments/route.ts`
- `src/app/api/projects/[projectId]/requests/[requestId]/attachments/route.ts`
- `src/components/requests/comments-section.tsx`
- `src/components/requests/attachments-section.tsx`

</code_context>

<specifics>
## Notes

- Comments show user avatar and date
- Users can delete own comments, owner can delete any
- Attachments are URL-based for MVP simplicity

</specifics>

---

*Phase: 08-comments-attachments*
*Context gathered: 2026-03-27*