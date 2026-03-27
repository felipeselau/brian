# Phase 11: Dependency Upgrades - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 11-dependency-upgrades
**Areas discussed:** Upgrade Strategy, React Version, Tailwind Upgrade, Verification Approach

---

## Upgrade Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential: Next.js first, then Prisma | Isola problemas, mais commits intermediários | ✓ |
| Sequential: Prisma first, then Next.js | Prisma geralmente tem menos breaking changes | |
| Big Bang: Tudo de uma vez | Mais rápido se funcionar, debug mais difícil | |
| You decide | Deixar o agente escolher | |

**User's choice:** Sequential: Next.js first, then Prisma
**Notes:** Recommended approach — Next 14→16 has more documented breaking changes, once working Prisma is more predictable.

---

## React Version

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on React 18 | Mais seguro, menos risco de quebrar @dnd-kit e outras libs | ✓ |
| Upgrade to React 19 | Novos features (use, Actions), mas pode quebrar libs | |
| You decide | Agente verifica compatibilidade e decide | |

**User's choice:** Stay on React 18
**Notes:** Focus is stability, not new features. React 19 can come in future milestone.

---

## Tailwind Upgrade

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Tailwind 3 | Funciona bem, sem breaking changes, foco em Next/Prisma | ✓ |
| Upgrade to Tailwind 4 | Mais trabalho, nova engine, config via CSS | |
| You decide | Agente avalia esforço e decide | |

**User's choice:** Keep Tailwind 3
**Notes:** This phase is about Next/Prisma. Tailwind 4 can be a separate phase.

---

## Verification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Manual checklist | Lista de funcionalidades críticas para testar manualmente | ✓ |
| Quick smoke tests | Criar alguns testes básicos durante o upgrade | |
| Build + Type check only | Se compila, assume que funciona (mais arriscado) | |
| You decide | Agente define a abordagem | |

**User's choice:** Manual checklist
**Notes:** Pragmatic for this phase. E2E tests will come in Phase 14.

---

## Agent's Discretion

- Order of fixing breaking changes within each upgrade
- Whether to update related dependencies (e.g., eslint-config-next)
- Intermediate commits for each sub-step

## Deferred Ideas

- React 19 upgrade — future milestone when ecosystem ready
- Tailwind 4 upgrade — separate phase due to config migration
- Automated tests during upgrade — E2E tests in Phase 14
