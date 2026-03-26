🧠 Freelance Board System — MVP Spec

📌 Visão Geral

Sistema de gerenciamento de projetos baseado em board (Trello-like), com foco em freelancers, times pequenos e clientes.

O sistema organiza o fluxo completo de trabalho:

Criação → Planejamento → Execução → Revisão → Aprovação → Finalização

Cada card (request) representa uma unidade de trabalho rastreável, auditável e potencialmente monetizável.

---

👤 Personas

👑 Owner

Responsável pela gestão geral do projeto.

Responsabilidades:

- Criar e configurar projetos
- Definir regras de workflow
- Gerenciar devs (workers)
- Revisar e aprovar progresso
- Controlar ciclo de vida dos tickets

---

💻 Worker (Dev)

Responsável pela execução das tasks.

Responsabilidades:

- Estimar horas
- Executar tickets
- Atualizar status
- Registrar progresso
- Solicitar mudanças de status

---

🧑‍💼 Cliente

Responsável pela validação e input de demandas.

Responsabilidades:

- Criar requests
- Aprovar entregas
- Acompanhar progresso

---

🧱 Estrutura do Sistema

Project

Project {
  id
  title
  description
  startDate
  endDate
  status (active | archived)

  columns[] (json)
  members[] (users)

  settings {
    requireEstimateBeforeStart: boolean
    estimateRequired: boolean
  }

  createdAt
}

---

Request (Card)

Request {
  id
  title
  description

  status (backlog | in_progress | review | done | blocked | waiting)

  projectId
  assignedTo
  createdBy

  estimatedHours
  loggedHours

  approvals {
    owner?: boolean
    client?: boolean
  }

  attachments[]
  comments[]

  lifecycleLog (json)

  createdAt
}

---

🔄 Fluxos Principais

👑 Owner cria projeto

1. Define:
   
   - startDate
   - endDate (opcional)

2. Configura board:
   
   - cria colunas manualmente OU usa template

3. Define regras:
   
   - requireEstimateBeforeStart
   - estimateRequired

4. Adiciona membros:
   
   - devs (workers)
   - cliente

5. Cria requests iniciais

6. Atribui devs

7. Compartilha acesso com cliente

---

💻 Worker entra no projeto

Regras:

- Se "requireEstimateBeforeStart = true"
  → precisa estimar horas antes de iniciar

- Se "estimateRequired = true"
  → não pode mover card sem estimativa

---

Ações:

- Estimar horas

- Mover cards no board

- Comentar

- Adicionar anexos

- Atualizar status:
  
  - waiting
  - blocked
  - done (vai para revisão)

- Solicitar mudança de status (dependendo da regra)

---

🧑‍💼 Cliente acessa o board

Permissões:

- Visualizar board completo
- Ver comentários e status
- Aprovar requests

---

Pode:

- Criar requests → entram em backlog
- Participar de refinamento (com owner/devs)
- Aprovar entregas

---

🔁 Fluxo de Request

Backlog →
In Progress →
Review →
Approved (Done)

Estados auxiliares:

- Blocked
- Waiting

---

🧠 Regras Importantes

Estimativa de Horas

- Pode ser obrigatória ou opcional
- Pode bloquear início do trabalho

---

Aprovação

- Requests podem exigir aprovação:
  - Owner
  - Cliente

---

Lifecycle Tracking

Cada mudança em um ticket deve gerar um log:

{
  from: "in_progress",
  to: "review",
  by: "userId",
  at: "timestamp"
}

---

Persistência

- Board, colunas e estrutura → armazenados em JSON
- Lifecycle completo → armazenado em JSON
- Histórico nunca sobrescrito (append-only)

---

Exclusão

- Request:
  
  - pode ser hard deleted pelo owner

- Project:
  
  - ao deletar → remove todos requests (hard delete)

---

Arquivamento

- Projeto pode ser arquivado
- Sistema gera:
  - snapshot único em JSON
  - estrutura minificada
  - pronto para export / backup

---

🖥️ Telas (MVP)

1. Dashboard

- lista de projetos
- filtros por status

---

2. Project Board

- colunas
- drag & drop de cards
- criação rápida de request

---

3. Card Modal

- descrição
- comentários
- horas
- anexos
- histórico

---

4. Project Settings

- membros
- regras (estimativa)
- colunas

---

✅ Definition of Ready (DoR)

Uma request está pronta para ser trabalhada quando:

- [ ] Tem título claro
- [ ] Tem descrição suficiente
- [ ] Está atribuída a um worker
- [ ] Está em status "backlog"
- [ ] Estimativa definida (se obrigatório)
- [ ] Dependências estão resolvidas

---

✅ Definition of Done (DoD)

Uma request é considerada concluída quando:

- [ ] Implementação finalizada
- [ ] Status = review
- [ ] Validada internamente (owner, se aplicável)
- [ ] Aprovada pelo cliente
- [ ] Movida para "done"
- [ ] Horas registradas corretamente
- [ ] Lifecycle completo registrado

---

🚫 Não Escopo (MVP)

- Automações complexas
- Workflows customizáveis
- Integrações externas
- Sistema financeiro completo
- IA

---

🚀 Próximos Passos

- Definir schema Prisma
- Implementar board (drag & drop)
- Criar sistema de roles (owner/dev/client)
- Implementar lifecycle log
- Criar UI de card modal
