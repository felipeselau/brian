# 🧠 Freelance OS (Brian) — Big Picture

📌 Visão do Produto

Freelance OS é um sistema de gestão de projetos baseado em board que conecta:
	•	Execução (requests / tickets)
	•	Comunicação (comentários / contexto)
	•	Planejamento (backlog / estimativas)
	•	Financeiro (horas → invoice)

🎯 Objetivo: Centralizar TODO o ciclo de um projeto freelance em um único sistema

⸻

👤 Personas

👑 Owner
	•	Gerencia projetos, board e membros
	•	Controla regras de execução
	•	Aprova entregas
	•	Responsável pelo financeiro

⸻

💻 Worker (Dev)
	•	Executa requests
	•	Estima e registra horas
	•	Atualiza status
	•	Colabora com contexto técnico

⸻

🧑‍💼 Cliente
	•	Cria requests
	•	Acompanha progresso
	•	Aprova entregas
	•	Aprova horas e invoices

⸻

🧱 Entidades Principais

Project
	•	Unidade central do sistema
	•	Contém board, membros, regras e contexto

⸻

Request (Card)
	•	Unidade de trabalho
	•	Pode ser monetizável
	•	Possui ciclo de vida rastreável

⸻

Column
	•	Representa status do fluxo
	•	Pode ser custom ou template

⸻

User
	•	Possui role:
	•	owner
	•	worker
	•	client

⸻

Invoice (fase futura)
	•	Gerado a partir de requests/hours aprovadas

⸻

Doc (fase futura)
	•	Documentação contextual por projeto

⸻

🔄 Fluxo Global do Sistema

Cliente cria request →
Owner organiza backlog →
Worker executa →
Worker registra horas →
Request vai para review →
Cliente aprova →
Owner gera invoice →
Pagamento


⸻

📌 Board System (Core)

Estrutura
	•	1 Project = 1 Board
	•	Board contém Columns
	•	Columns contêm Requests

⸻

Status padrão
	•	backlog
	•	in_progress
	•	review
	•	done

⸻

Status auxiliares
	•	blocked
	•	waiting

⸻

Regras de movimentação

Worker:
	•	backlog → in_progress
	•	in_progress → review

Owner:
	•	pode mover qualquer card

Cliente:
	•	review → done (aprovação)

⸻

⏱️ Sistema de Horas

Regras:
	•	Pode ser obrigatório (configurável)
	•	Pode bloquear início do trabalho

⸻

Tipos:
	•	estimatedHours (antes de iniciar)
	•	loggedHours (durante execução)

⸻

Regras de negócio:
	•	Worker pode estimar
	•	Owner pode revisar
	•	Cliente pode aprovar

⸻

🧠 Sistema de Aprovação

Níveis:
	•	Owner approval (opcional)
	•	Client approval (final)

⸻

Regras:
	•	Request só vai para “done” após aprovação
	•	Pode existir estado intermediário (review)

⸻

📝 Requests (Detalhamento)

Campos principais:
	•	título
	•	descrição
	•	status
	•	responsável
	•	criador
	•	horas estimadas
	•	horas logadas

⸻

Funcionalidades:
	•	comentários
	•	anexos
	•	histórico completo
	•	atribuição

⸻

Regras:
	•	podem ser criados por qualquer persona (com restrição)
	•	backlog é ponto de entrada principal

⸻

🔁 Lifecycle Tracking (Audit Log)

Todo evento gera log:
	•	mudança de status
	•	mudança de responsável
	•	edição
	•	aprovação

⸻

Estrutura:

{
  "from": "in_progress",
  "to": "review",
  "by": "userId",
  "at": "timestamp"
}


⸻

Regras:
	•	append-only (não sobrescrever)
	•	auditável
	•	fonte de verdade do sistema

⸻

🧑‍💼 Cliente Experience

Deve ser:
	•	simples
	•	clara
	•	não técnica

⸻

Pode:
	•	ver board
	•	ver progresso
	•	comentar
	•	aprovar
	•	criar requests

⸻

NÃO pode:
	•	gerenciar estrutura
	•	ver complexidade interna

⸻

👑 Owner Controls

Pode:
	•	definir regras do projeto
	•	configurar colunas
	•	adicionar/remover membros
	•	deletar requests
	•	arquivar projetos

⸻

💻 Worker Experience

Pode:
	•	trabalhar nos requests
	•	logar horas
	•	atualizar status
	•	colaborar via comentários

⸻

Não pode:
	•	aprovar final
	•	gerenciar projeto

⸻

🗂️ Persistência (Arquitetura de Dados)

JSON-first approach:

Board:
	•	armazenado como JSON

Lifecycle:
	•	armazenado como JSON (append-only)

⸻

Vantagens:
	•	flexibilidade
	•	versionamento fácil
	•	exportação simples

⸻

🗃️ Arquivamento

Projeto pode ser:
	•	ativo
	•	arquivado

⸻

Arquivamento:
	•	gera snapshot único
	•	minifica estrutura
	•	mantém histórico completo

⸻

🗑️ Exclusão

Request:
	•	pode ser hard deleted pelo owner

Project:
	•	hard delete remove tudo

⸻

💰 Sistema Financeiro (Fase 2+)

Baseado em:
	•	horas aprovadas
	•	requests concluídas

⸻

Funcionalidades:
	•	gerar invoice
	•	status:
	•	pending
	•	approved
	•	paid

⸻

Fluxo:

Horas aprovadas →
Invoice gerada →
Cliente aprova →
Pagamento


⸻

📝 Documentação (Fase 2+)

Por projeto:
	•	briefing
	•	escopo
	•	entrega

⸻

Regras:
	•	contextual
	•	não genérico
	•	ligado ao projeto

⸻

🔗 Links Hub (Fase 2+)
	•	Figma
	•	Deploy
	•	Repositório
	•	Assets

⸻

🚀 Roadmap

⸻

🥇 Fase 1 — Core Board
	•	Projetos
	•	Board (kanban)
	•	Requests
	•	Comentários
	•	Lifecycle log
	•	Roles (owner/dev/client)

⸻

🥈 Fase 2 — Estrutura Completa
	•	Docs
	•	Links
	•	Sistema de horas completo
	•	Aprovações refinadas

⸻

🥉 Fase 3 — Financeiro
	•	Invoice
	•	Aprovação financeira
	•	Histórico de receita

⸻

🏆 Fase 4 — Produto Avançado
	•	Client Portal completo
	•	Dashboard geral
	•	Insights

⸻

🤖 Fase 5 — Inteligência
	•	IA (propostas, resumos, precificação)
	•	automações

⸻

⚠️ Princípios do Produto

1. Simplicidade > Flexibilidade

Não virar sistema complexo tipo Jira

⸻

2. Contexto > Liberdade

Não virar Notion genérico

⸻

3. Trabalho = Dinheiro

Toda request deve poder virar valor

⸻

4. Cliente no fluxo

Cliente faz parte do sistema, não externo

⸻

5. Auditabilidade

Tudo deve ser rastreável

⸻

🚫 Anti-Goals
	•	Não ser um kanban genérico
	•	Não ser um sistema técnico demais
	•	Não ter permissões complexas
	•	Não ter workflows infinitos
	•	Não depender de integrações externas no início

⸻

🔥 Resumo Final

Freelance OS é:

Um sistema onde:

	•	trabalho é estruturado (requests)
	•	execução é rastreada (lifecycle)
	•	validação é clara (aprovações)
	•	valor é capturado (horas → invoice)

Tudo dentro de um único fluxo simples e consistente.
:::