# Brian - Freelance Board System

Sistema de gerenciamento de projetos baseado em board (Trello-like), com foco em freelancers, times pequenos e clientes.

## Stack Tecnológica

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: NextAuth.js v5
- **UI**: shadcn/ui + Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Deploy**: Vercel

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar PostgreSQL

Você tem duas opções:

#### Opção A: PostgreSQL Local

Instale o PostgreSQL localmente e crie um banco de dados:

```bash
# No PostgreSQL
CREATE DATABASE brian_db;
```

#### Opção B: Vercel Postgres (Recomendado para deploy)

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Crie um novo projeto Postgres
3. Copie a `DATABASE_URL` fornecida

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/brian_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cole-aqui-uma-secret-key-gerada"

# Vercel Blob (para uploads)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

Para gerar o `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Executar migrations do Prisma

```bash
npx prisma migrate dev --name init
```

### 5. (Opcional) Seed do banco de dados

```bash
npx prisma db seed
```

### 6. Executar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
brian/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Páginas de autenticação
│   │   ├── (dashboard)/       # Páginas protegidas
│   │   └── api/               # API Routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth/              # Componentes de auth
│   │   ├── board/             # Componentes do Kanban board
│   │   ├── projects/          # Componentes de projetos
│   │   └── requests/          # Componentes de requests/cards
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   └── validations/       # Schemas Zod
│   └── types/
│       └── index.ts           # TypeScript types
└── package.json
```

## Features

### Personas

- **Owner**: Gerencia projetos, membros e regras
- **Worker**: Executa tarefas, estima horas, atualiza status
- **Client**: Cria requests, aprova entregas, acompanha progresso

### Principais Funcionalidades

- ✅ Sistema de autenticação (email/password)
- ✅ Gerenciamento de projetos
- ✅ Kanban board com drag & drop
- ✅ Sistema de requests/cards
- ✅ Sistema de comentários
- ✅ Upload de attachments
- ✅ Tracking de horas (estimadas vs logadas)
- ✅ Sistema de aprovações
- ✅ Lifecycle log (histórico completo)
- ✅ Arquivamento e export JSON

### Regras de Negócio

- **requireEstimateBeforeStart**: Bloqueia início de trabalho sem estimativa
- **estimateRequired**: Obriga estimativa em qualquer movimento

## Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Start produção
npm run lint         # ESLint
npx prisma studio    # UI do Prisma para visualizar dados
npx prisma migrate dev --name <nome>  # Criar nova migration
```

## Deploy na Vercel

1. Push do código para GitHub
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

## Documentação

Para mais detalhes sobre a arquitetura e especificações, veja `overview.md`.

## Licença

ISC
