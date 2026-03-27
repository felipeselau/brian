---
name: shadcn-component
description: Adicionar e criar componentes UI com shadcn/ui + Tailwind
---

## Para Adicionar Componente shadcn

```bash
npx shadcn-ui@latest add <component-name>
```

Componentes disponíveis (não instalados):
tabs, scroll-area, tooltip, switch, slider, table, alert, accordion, checkbox, radio-group, progress, skeleton

Componentes já instalados:
button, card, dialog, input, label, textarea, badge, avatar, dropdown-menu, select, separator, sonner

## Para Criar Componente Customizado

### Estrutura do Arquivo

```typescript
// src/components/<categoria>/nome-componente.tsx

"use client"; // apenas se usar hooks/eventos/estado

import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ComponentNameProps {
  titulo: string;
  descricao?: string;
  variant?: "default" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export function ComponentName({
  titulo,
  descricao,
  variant = "default",
  className,
  children,
}: ComponentNameProps) {
  return (
    <div className={cn("base-classes", className)}>
      <h3>{titulo}</h3>
      {descricao && <p className="text-muted-foreground">{descricao}</p>}
      {children}
    </div>
  );
}
```

## Padrões de Estilização Tailwind

### Espaçamento
- Containers: `p-4`, `p-6`
- Gaps: `gap-2` (pequeno), `gap-4` (médio), `gap-6` (grande)
- Margins: `space-y-4` para vertical, `space-x-4` para horizontal

### Layout
- Flex: `flex items-center justify-between`
- Grid: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`
- Scroll: `overflow-x-auto pb-4`

### Bordas e Sombras
- Bordas: `rounded-lg border`
- Sombras: `shadow-sm`, `shadow-md`, `hover:shadow-lg transition-shadow`

### Cores do Tema
- Background: `bg-background`, `bg-muted`, `bg-card`
- Texto: `text-foreground`, `text-muted-foreground`
- Ação: `bg-primary text-primary-foreground`
- Erro: `bg-destructive text-destructive-foreground`
- Borda: `border-border`

### Badges de Status
```typescript
// Project
ACTIVE: "bg-green-500"
ARCHIVED: "bg-gray-500"

// Request
BACKLOG: "bg-gray-400"
IN_PROGRESS: "bg-blue-500"
REVIEW: "bg-yellow-500"
DONE: "bg-green-500"
BLOCKED: "bg-red-500"
WAITING: "bg-orange-500"
```

## Convenções

- Named export: `export function ComponentName()`
- Interface de props tipada
- "use client" apenas quando necessário
- Importar cn de `@/lib/utils` para combinar classes
- Props opcionais com valores padrão
