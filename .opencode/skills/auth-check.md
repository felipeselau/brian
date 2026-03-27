---
name: auth-check
description: Padrão de verificação de autenticação em Server Components e API Routes
---

## Server Component / Page

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Acesso seguro:
  // session.user.id    → string (user ID)
  // session.user.email → string
  // session.user.name  → string | null
  // session.user.role  → UserRole (OWNER | WORKER | CLIENT)
  // session.user.image → string | null
}
```

## API Route

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function handler(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificação de permissão por role
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Lógica da rota...
}
```

## Middleware (já configurado)

O `src/middleware.ts` protege rotas automaticamente:
- Rotas públicas: `/login`, `/register`
- Rotas protegidas: todas as outras (redireciona para `/login` se não autenticado)

## Verificação de Permissões por Role

```typescript
// Apenas OWNER
if (session.user.role !== "OWNER") { ... }

// OWNER ou WORKER
if (!["OWNER", "WORKER"].includes(session.user.role)) { ... }

// Qualquer usuário autenticado (já verificado com session?.user?.id)
```

## Verificação de Membro do Projeto

```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    members: { where: { userId: session.user.id } },
  },
});

const isOwner = project?.ownerId === session.user.id;
const isMember = (project?.members?.length ?? 0) > 0;

if (!isOwner && !isMember) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

## Nunca Fazer

- Confiar apenas no middleware — sempre verificar `session` no server
- Usar `session.user` sem verificar `session?.user?.id` primeiro
- Expor `session.user` completo em responses de API
