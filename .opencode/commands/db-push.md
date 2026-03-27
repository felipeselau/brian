---
name: db-push
description: Sincronizar schema Prisma com o banco de dados (sem migration)
---
Sincroniza o schema Prisma com o banco de dados de desenvolvimento:

1. `npx prisma generate` — regenera o client TypeScript
2. `npx prisma db push` — aplica mudanças ao DB

Usar `db-push` para desenvolvimento rápido (sem versionamento de migration).
Usar `migrate dev` quando quiser criar migration versionada para produção.

Executar em: `/Users/wwfehh/nerd/projects/brian`
