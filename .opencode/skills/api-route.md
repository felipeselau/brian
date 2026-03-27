---
name: api-route
description: Template para criar API routes com autenticação, validação e Prisma
---

## Template Base (GET / POST / PATCH / DELETE)

### Arquivo: `src/app/api/<recurso>/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSchema } from "@/lib/validations/recurso";

// GET — Listar recursos
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.recurso.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — Criar recurso
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar permissão por role
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const item = await prisma.recurso.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Arquivo: `src/app/api/<recurso>/[id]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateSchema } from "@/lib/validations/recurso";

// GET — Buscar por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.recurso.findUnique({
    where: { id: params.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PATCH — Atualizar
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const item = await prisma.recurso.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE — Deletar
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.recurso.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

## Zod Schema Associado

### Arquivo: `src/lib/validations/recurso.ts`

```typescript
import { z } from "zod";
import { StatusEnum } from "@prisma/client";

export const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  projectId: z.string(),
});

export const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(StatusEnum).optional(),
});

export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
```

## Checklist ao Criar Nova API Route

- [ ] Autenticação verificada (`session?.user?.id`)
- [ ] Permissão por role verificada (se aplicável)
- [ ] Validação Zod no body
- [ ] Try/catch com tratamento de ZodError
- [ ] Status codes corretos (200, 201, 400, 401, 403, 404, 500)
- [ ] Prisma queries com `include` quando necessário
