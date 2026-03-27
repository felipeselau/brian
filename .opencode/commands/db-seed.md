---
name: db-seed
description: Popular banco de dados com dados de teste
---
Executa o seed do Prisma para popular o banco com dados de exemplo:

1. Verificar se `prisma/seed.ts` existe
2. Rodar `npx prisma db seed`

Se o seed não existir, criar com dados de exemplo:
- **Users**: 1 Owner, 2 Workers, 1 Cliente (senhas hash com bcryptjs)
- **Projects**: 2 ativos, 1 arquivado
- **Members**: Workers e Cliente adicionados aos projetos
- **Requests**: Distribuídos em diferentes status (BACKLOG, IN_PROGRESS, REVIEW, DONE)
- **Comments**: Alguns comentários nos requests

Credenciais de teste:
- owner@test.com / senha123 (Owner)
- worker1@test.com / senha123 (Worker)
- worker2@test.com / senha123 (Worker)
- client@test.com / senha123 (Cliente)

Executar em: `/Users/wwfehh/nerd/projects/brian`
