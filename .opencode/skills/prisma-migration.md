---
name: prisma-migration
description: Criar migrations Prisma de forma segura e consistente
---

## Fluxo de Migration

1. Editar `prisma/schema.prisma` com as mudanças desejadas
2. Rodar `npx prisma generate` — regenera o client TypeScript
3. Rodar `npx prisma migrate dev --name <nome-descritivo>` — cria migration
4. Verificar que migration foi criada em `prisma/migrations/`
5. Se necessário, rodar `npx prisma studio` para validar dados

## Convenções de Nomes

- Migration: snake_case descritivo
  - Exemplos: `add_request_approvals`, `create_comments_table`, `add_project_settings`
- Models: PascalCase singular (`User`, `Project`, `Request`)
- Tabelas: snake_case plural com `@@map()` (`users`, `projects`, `requests`)
- Campos: camelCase (`createdAt`, `loggedHours`, `estimatedHours`)

## Estrutura de JSON Fields

Quando adicionar ou modificar JSON fields, documentar a estrutura:

```prisma
// JSON fields
columns     Json    // Array: [{ id: string, title: string, order: number }]
settings    Json    // { requireEstimateBeforeStart: boolean, estimateRequired: boolean }
approvals   Json    // { owner: boolean | null, client: boolean | null }
lifecycleLog Json   // Array: [{ from: string, to: string, by: string, at: string }]
```

## Relações Comuns

```prisma
// One-to-Many com cascade
requests    Request[]  @relation

// Many-to-Many via tabela intermediária
members     ProjectMember[]

// Delete behavior
onDelete: Cascade     // Deletar pai deleta filhos
onDelete: SetNull     // Deletar pai seta FK como null
onDelete: Restrict    // Impede deletar se tem filhos
```

## Dicas

- Nunca deletar migrations existentes
- Usar `npx prisma db push` para desenvolvimento rápido (sem migration versionada)
- Usar `npx prisma migrate dev` para migrations versionadas (produção)
- Após mudanças no schema, sempre rodar `npx prisma generate`
