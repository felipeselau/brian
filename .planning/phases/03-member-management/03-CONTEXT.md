# Phase 3: Member Management - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Owner can manage project members — add workers and clients, remove members.

</domain>

<decisions>
## Implementation Decisions

### Member API Routes
- **D-01:** GET /api/projects/[projectId]/members — Lista membros do projeto
- **D-02:** POST /api/projects/[projectId]/members — Adiciona membro (apenas owner)
- **D-03:** DELETE /api/projects/[projectId]/members — Remove membro (apenas owner)

### Member Validation
- **D-04:** Verifica se usuário já é membro antes de adicionar
- **D-05:** Verifica se usuário existe antes de adicionar
- **D-06:** Owner só pode adicionar usuários com role WORKER ou CLIENT

### Permissions
- **D-07:** Apenas owner pode adicionar/remover membros
- **D-08:** Membros podem ver o projeto após adicionados

### Agent's Discretion
- UI de members — usar dialog/modal para adicionar membros

</decisions>

<canonical_refs>
## Canonical References

### Members API
- `src/app/api/projects/[projectId]/members/route.ts` — Full CRUD for members

### Related Files
- `prisma/schema.prisma` — ProjectMember model
- `.planning/PROJECT.md` — Core value
- `.planning/REQUIREMENTS.md` — MEMB-01 a MEMB-07 definitions

</canonical_refs>

## Existing Code Insights

### Reusable Assets
- ProjectMember Prisma model exists
- Member role enum in Prisma (WORKER, CLIENT)

### Integration Points
- User lookup via Prisma
- Project access check (owner ou member)

</code_context>

<specifics>
## Specific Ideas

- Adicionar membros por email (buscar usuário)

</specifics>

<deferred>
## Deferred Ideas

[MEMB-05, MEMB-06, MEMB-07 serão implementados em fases futuras]

</deferred>

---

*Phase: 03-member-management*
*Context gathered: 2026-03-27*