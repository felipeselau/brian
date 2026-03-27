# 🧠 Brian — Freelance Board System

## Visão Geral
Sistema de gerenciamento de projetos freelancer (Trello-like).
Stack: Next.js 14 + Prisma + PostgreSQL + NextAuth v5 + shadcn/ui + @dnd-kit.

## Stack Tecnológica
- **Framework**: Next.js 14 (App Router, Server/Client Components)
- **ORM**: Prisma + PostgreSQL
- **Auth**: NextAuth.js v5 (JWT, Credentials Provider, email/senha)
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS
- **DnD**: @dnd-kit/core + @dnd-kit/sortable
- **Validação**: Zod
- **Upload**: @vercel/blob (MVP)
- **Deploy**: Vercel

## Estrutura de Diretórios
```
src/
├── app/
│   ├── (auth)/          # Páginas públicas (login, register)
│   ├── (dashboard)/     # Páginas protegidas (dashboard, projects)
│   └── api/             # API routes (auth, projects, requests)
├── components/
│   ├── ui/              # Componentes shadcn/ui (não modificar)
│   ├── layout/          # Navbar, UserMenu
│   ├── projects/        # ProjectCard, ProjectList, CreateProjectDialog
│   ├── board/           # Board Kanban (Fase 7-8)
│   ├── requests/        # RequestCard, RequestModal (Fase 9-10)
│   └── auth/            # LoginForm, RegisterForm
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client singleton
│   ├── utils.ts         # cn() utility
│   └── validations/     # Zod schemas
└── types/               # TypeScript types
```

## Convenções de Código

### Imports
- Usar `@/*` → mapeia para `src/*`
- Imports de biblioteca primeiro, depois absolutos, depois relativos

### Components
- **Server Components**: padrão, não marcar com "use client"
- **Client Components**: marcar com "use client" apenas quando necessário (hooks, eventos, estado)
- Exportar como named exports: `export function ComponentName()`
- Props: definir interface TypeScript tipada

### Autenticação
- Server Components: `const session = await auth()` + `if (!session?.user?.id) redirect("/login")`
- API Routes: `const session = await auth()` + check `session?.user?.id`
- Nunca confiar apenas no middleware — sempre verificar session no server

### Validação
- Zod schemas em `src/lib/validations/<recurso>.ts`
- Sempre usar `.parse()` ou `.safeParse()` nos inputs das API routes
- Tipar com `z.infer<typeof schema>`

### Prisma
- Client singleton em `src/lib/prisma.ts`
- Usar `include` para trazer relações
- Usar `select` para limitar campos retornados

### Estilização
- Variáveis Tailwind: `bg-background`, `text-foreground`, `text-muted-foreground`
- Bordas: `rounded-lg`
- Hover: `hover:shadow-lg transition-shadow`
- Grids responsivos: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`

## Nomes de Campos (Prisma)
- `title` (não `name`) em Project e Request
- `loggedHours` (não `hoursSpent`) em Request
- `estimatedHours` (não `estimate`) em Request
- `createdById` (não `authorId`) em Request
- `assignedToId` (não `assigneeId`) em Request

## JSON Fields (Estruturas)
- `Project.columns`: `[{ id: string, title: string, order: number }]`
- `Project.settings`: `{ requireEstimateBeforeStart: boolean, estimateRequired: boolean }`
- `Request.approvals`: `{ owner?: boolean, client?: boolean }`
- `Request.lifecycleLog`: `[{ from: string, to: string, by: string, at: string }]`

## Enums (Prisma)
- **UserRole**: OWNER, WORKER, CLIENT
- **ProjectStatus**: ACTIVE, ARCHIVED
- **RequestStatus**: BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED, WAITING

## Regras de Negócio
- Apenas OWNER pode criar/editar/deletar projetos
- OWNER gerencia membros do projeto
- WORKER estima horas e executa tarefas
- CLIENT cria requests (vão para backlog) e aprova entregas
- Se `requireEstimateBeforeStart = true` → Worker DEVE estimar antes de iniciar
- Se `estimateRequired = true` → Card NÃO pode ser movido sem estimativa
- Lifecycle log é append-only (nunca sobrescrito)
- Deletar projeto → hard delete de todos requests (cascade)

## Commits
- Formato: `<type>(<scope>): <subject>`
- Tipos: feat, fix, refactor, docs, style, chore
- Scopes: projects, requests, board, auth, api, ui, db
- Exemplos: `feat(board): add drag and drop`, `fix(auth): handle null session`

## Comandos Úteis
```bash
npm run dev              # Iniciar dev server
npm run build            # Build de produção
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check
npx prisma generate      # Gerar Prisma client
npx prisma migrate dev   # Criar migration
npx prisma studio        # Abrir Prisma Studio
npx prisma db push       # Push schema (sem migration)
npx shadcn-ui@latest add # Adicionar componente shadcn
```

## Fases de Implementação (overview.md)
| Status | Fase | Descrição |
|--------|------|-----------|
| ✅ | 0-4 | Setup, Auth, UI Foundation |
| ✅ | 5 | Projects CRUD |
| ⏳ | 6 | Member Management & Settings |
| ⏳ | 7-8 | Kanban Board + Drag & Drop |
| ⏳ | 9-10 | Requests CRUD + Modal |
| ⏳ | 11-12 | Comments + Attachments |
| ⏳ | 13-15 | Hours Tracking, Approvals, Lifecycle |
| ⏳ | 16-17 | Business Rules + Archival |
| ⏳ | 18-20 | UX Polish + Deploy |
