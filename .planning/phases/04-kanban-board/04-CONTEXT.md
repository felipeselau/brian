# Phase 4: Kanban Board - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Kanban board com colunas e drag & drop de cards usando @dnd-kit.

</domain>

<decisions>
## Implementation Decisions

### Board Structure
- **D-01:** Colunas armazenadas em JSON no campo `Project.columns`
- **D-02:** Estrutura: `[{ id: string, title: string, order: number }]`
- **D-03:**@dnd-kit para drag & drop entre colunas
- **D-04:**@dnd-kit/sortable para reordenar cards

### Board UI Components
- **D-05:** Board component (container das colunas)
- **D-06:** Column component (cada coluna)
- **D-07:** RequestCard component (card visual)
- **D-08:** Quick add para criar request na coluna

### API Routes
- **D-09:** GET /api/projects/[projectId]/board - retorna colunas com requests
- **D-10:** PATCH status para mover requests entre colunas
- **D-11:** PATCH position para reordenar dentro da coluna

### Agent's Discretion
- UI responsiva com scroll horizontal nas colunas
- Animações suaves no drag & drop

</decisions>

<canonical_refs>
## Canonical References

### Board Implementation
- `src/components/board/` — Board, Column, RequestCard components
- `@dnd-kit/core` — Drag & drop core
- `@dnd-kit/sortable` — Sortable functionality
- `prisma/schema.prisma` — Request com position field

### Files
- `.planning/PROJECT.md` — Core value
- `.planning/REQUIREMENTS.md` — BOARD-01 a BOARD-05 definitions

</canonical_refs>

## Existing Code Insights

### Existing Assets
- `@dnd-kit/core` e `@dnd-kit/sortable` já instalados
- Request model tem campo `position` para ordenação
- Columns JSON em Project model
- ProjectSettings tabs já funcionam (Board tab existe)

</code_context>

<specifics>
## Specific Ideas

- Kanban board visual similar ao Trello
- Colunas: Backlog, In Progress, Review, Done (default)
- owner pode adicionar/remover colunas

</specifics>

<deferred>
## Deferred Ideas

- BOARD-02 (add/remove columns) — pode ser simplificado para MVP
- BOARD-03 (reorder columns) — pode ser deferido

</deferred>

---

*Phase: 04-kanban-board*
*Context gathered: 2026-03-27*