# Phase 3: Member Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 3-member-management
**Areas discussed:** Member API implementation, permissions

---

## Analysis Summary

Phase 3 partially **implemented** — API route exists:

- **MEMB-01/02/03**: API CRUD funcionando (`src/app/api/projects/[projectId]/members/route.ts`)
- **MEMB-04**: Implementado indiretamente (membros veem projetos via query existente)
- **MEMB-05/06/07**: Pendente (hora estimating/logging, client criando requests)

### Gray Areas
- UI para adicionar membros (não existe dialog ainda)
- Buscar usuário por email vs convidar por email

### Resolution

API completa, UI pendente. A discussão focou na estrutura da API e permissões.

## Deferred Ideas

- **MEMB-05**: Worker estimation — será em Request phase
- **MEMB-06**: Worker hours logging — será em Hours Tracking phase  
- **MEMB-07**: Client creating requests — será em Request phase