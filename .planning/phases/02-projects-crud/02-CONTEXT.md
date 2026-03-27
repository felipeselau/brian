# Phase 2: Projects CRUD - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Full project management — create, read, update, delete projects with proper permissions.

</domain>

<decisions>
## Implementation Decisions

### Project API Routes
- **D-01:** GET /api/projects — Lista projetos do usuário (owner ou member)
- **D-02:** POST /api/projects — Cria projeto (apenas OWNER)
- **D-03:** GET /api/projects/[projectId] — Busca projeto detalhado
- **D-04:** PATCH /api/projects/[projectId] — Atualiza projeto (apenas owner)
- **D-05:** DELETE /api/projects/[projectId] — Deleta projeto (apenas owner, cascade)

### Project UI Components
- **D-06:** CreateProjectDialog — Modal para criar projetos
- **D-07:** ProjectCard — Card display para cada projeto
- **D-08:** ProjectList — Lista renderizando ProjectCards

### Project Pages
- **D-09:** /projects — Lista todos os projetos com filtro por status
- **D-10:** /projects/[projectId] — Detalhes do projeto

### Validation
- **D-11:** Zod schemas em `src/lib/validations/project.ts`
- **D-12:** DEFAULT_COLUMNS e DEFAULT_PROJECT_SETTINGS de `@/types`

### Agent's Discretion
[Nenhum — todas decisões já tomadas no código existente]

</decisions>

<canonical_refs>
## Canonical References

### Projects
- `src/app/api/projects/route.ts` — GET/POST projects
- `src/app/api/projects/[projectId]/route.ts` — GET/PATCH/DELETE single project
- `src/app/(dashboard)/projects/page.tsx` — Projects list page
- `src/app/(dashboard)/projects/[projectId]/page.tsx` — Project detail page
- `src/components/projects/create-project-dialog.tsx` — Create form
- `src/components/projects/project-card.tsx` — Card component
- `src/components/projects/project-list.tsx` — List component
- `src/lib/validations/project.ts` — Zod validation schemas
- `prisma/schema.prisma` — Project model

### Files
- `.planning/PROJECT.md` — Core value e requirements
- `.planning/REQUIREMENTS.md` — PROJ-01 a PROJ-04, DASH-01, DASH-02 definitions

</canonical_refs>

mathbf
## Existing Code Insights

### Reusable Assets
- Default columns e settings em `src/types/index.ts`
- ProjectMember relation no Prisma schema
- Status filtering funcionando via searchParams

### Integration Points
- Auth check em todas as routes
- Permission check: apenas owner pode criar/editar/deletar
- Cascade delete para requests ao deletar projeto

</code_context>

<specifics>
## Specific Ideas

[Não há necessidades específicas — abordagem padrão completa]

</specifics>

<deferred>
## Deferred Ideas

[Ideias que surgiram mas pertencem a outras fases.]

### Reviewed (not folded)
[Nenhuma — discussão stayed dentro do escopo da fase]

</deferred>

---

*Phase: 02-projects-crud*
*Context gathered: 2026-03-26*