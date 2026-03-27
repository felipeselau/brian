# Phase 5: Requests CRUD - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Full request management — create, read, update, delete requests com atribuição de workers e tracking de horas.

</domain>

<decisions>
## Implementation Decisions

### Request API Routes
- **D-01:** GET /api/projects/[projectId]/requests — Lista requests do projeto
- **D-02:** POST /api/projects/[projectId]/requests — Cria novo request
- **D-03:** GET /api/projects/[projectId]/requests/[requestId] — Detalhes do request
- **D-04:** PATCH /api/projects/[projectId]/requests/[requestId] — Atualiza request
- **D-05:** DELETE /api/projects/[projectId]/requests/[requestId] — Deleta request (apenas owner)

### Request UI Components
- **D-06:** CreateRequestDialog — Modal para criar requests
- **D-07:** EditRequestForm — Form de edição na página de detalhes
- **D-08:** BoardWrapper atualizado com botão "New Request"

### Lifecycle Log
- **D-09:** Cada mudança de status adiciona entrada no lifecycleLog JSON
- **D-10:** Formato: { from, to, by, at }

### Permissions
- **D-11:** Owner pode editar/deletar qualquer request
- **D-12:** Assigned worker pode editar request
- **D-13:** CreatedBy pode editar request

### Agent's Discretion
- Pages usam Server Components com Client Components para forms
- Dialog de criação integrado no Board tab

</decisions>

<canonical_refs>
## Canonical References

### Requests API
- `src/app/api/projects/[projectId]/requests/route.ts` — CRUD de requests
- `src/app/api/projects/[projectId]/requests/[requestId]/route.ts` — Single request

### UI Components
- `src/components/requests/create-request-dialog.tsx`
- `src/app/(dashboard)/projects/[projectId]/requests/[requestId]/edit-request-form.tsx`

### Related Files
- `prisma/schema.prisma` — Request model

</code_context>

<specifics>
## Specific Ideas

- Request detail page: /projects/[projectId]/requests/[requestId]
- Status workflow: BACKLOG → IN_PROGRESS → REVIEW → DONE
- Hours tracking: estimatedHours, loggedHours

</specifics>

<deferred>
## Deferred Ideas

- Comments (COMM-01, COMM-02) — Fase 11-12
- Attachments (ATT-01 a ATT-03) — Fase 11-12

</deferred>

---

*Phase: 05-requests-crud*
*Context gathered: 2026-03-27*