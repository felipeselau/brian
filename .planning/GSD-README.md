# GSD (Get Shit Done) Workflow — Brian Project

## Overview

GSD é um workflow estruturado para planejamento e execução de fases de projeto. Cada fase passa por research → planning → execution → verification.

## Estrutura de Arquivos

```
.planning/
├── config.json         # Configuração do workflow GSD
├── PROJECT.md          # Visão geral do projeto
├── REQUIREMENTS.md     # Requisitos funcionais
├── ROADMAP.md          # 10 fases com critérios de sucesso
├── STATE.md            # Estado atual de execução
├── codebase/           # Análise técnica do codebase (7 docs)
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── CONCERNS.md
│   ├── INTEGRATIONS.md
│   ├── STACK.md
│   ├── STRUCTURE.md
│   └── TESTING.md
└── phases/             # Contexto e planos por fase
    ├── 01-setup-auth-foundation/
    ├── 02-projects-crud/
    ├── 03-member-management/
    ├── 04-kanban-board/
    ├── 05-requests-crud/
    ├── 06-hours-tracking/
    ├── 07-lifecycle-log/
    ├── 08-comments-attachments/
    ├── 09-approvals/
    └── 10-business-rules/
```

## Agentes GSD Configurados

| Agente | Função | Arquivo |
|--------|--------|---------|
| `gsd-planner` | Cria planos executáveis | `.opencode/agents/gsd-planner.md` |
| `gsd-phase-researcher` | Pesquisa abordagens técnicas | `.opencode/agents/gsd-phase-researcher.md` |
| `gsd-plan-checker` | Verifica qualidade dos planos | `.opencode/agents/gsd-plan-checker.md` |
| `gsd-executor` | Executa tarefas do plano | `.opencode/agents/gsd-executor.md` |
| `gsd-verifier` | Valida completude da fase | `.opencode/agents/gsd-verifier.md` |
| `gsd-codebase-mapper` | Mapeia estrutura do código | `.opencode/agents/gsd-codebase-mapper.md` |

## Configuração Atual (config.json)

```json
{
  "mode": "yolo",
  "granularity": "coarse",
  "parallelization": true,
  "commit_docs": true,
  "workflow": {
    "research": false,
    "plan_check": true,
    "verifier": true,
    "auto_advance": true
  }
}
```

## Comandos GSD

```bash
# Planejar uma fase
/gsd-plan-phase <número>

# Executar um plano
/gsd-execute-phase <número>

# Verificar completude
/gsd-verify <número>

# Atualizar mapa do codebase
/gsd-map-codebase
```

## Estado Atual do Projeto

✅ **Todas as 10 fases completas**

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Setup & Auth | ✅ Complete |
| 2 | Projects CRUD | ✅ Complete |
| 3 | Member Management | ✅ Complete |
| 4 | Kanban Board | ✅ Complete |
| 5 | Requests CRUD | ✅ Complete |
| 6 | Hours Tracking | ✅ Complete |
| 7 | Lifecycle Log | ✅ Complete |
| 8 | Comments & Attachments | ✅ Complete |
| 9 | Approvals | ✅ Complete |
| 10 | Business Rules | ✅ Complete |

## Próximos Passos (Pós-MVP)

1. UX polish — loading states, empty states, animations
2. Mobile responsiveness audit
3. Performance optimization
4. E2E tests com Playwright
5. Deploy to Vercel

---

*Documentação GSD atualizada: 2026-03-27*
