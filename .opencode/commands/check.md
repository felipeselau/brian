---
name: check
description: Rodar lint + typecheck de uma vez para verificar qualidade do código
---
Executa verificação completa de qualidade do código:

1. `npm run lint` — ESLint (warnings e erros)
2. `npx tsc --noEmit` — TypeScript (erros de tipo)

Ambos devem passar sem erros antes de qualquer commit.
Se houver erros, corrigir antes de prosseguir.

Executar em: `/Users/wwfehh/nerd/projects/brian`
