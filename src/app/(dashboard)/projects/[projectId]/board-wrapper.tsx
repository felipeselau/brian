"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/board";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TicketStatus } from "@prisma/client";

interface Column {
  id: string;
  title: string;
  order: number;
}

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  estimatedHours: number | null;
  loggedHours: number;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface BoardWrapperProps {
  projectId: string;
  columns: Column[];
  tickets: Ticket[];
  members: Member[];
}

export function BoardWrapper({ projectId, columns, tickets, members }: BoardWrapperProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("BACKLOG");

  const handleAddTicket = (columnId: string) => {
    // Map column id to status
    const statusMap: Record<string, string> = {
      backlog: "BACKLOG",
      in_progress: "IN_PROGRESS",
      review: "REVIEW",
      done: "DONE",
      blocked: "BLOCKED",
      waiting: "WAITING",
    };
    setDefaultStatus(statusMap[columnId] || "BACKLOG");
    setIsCreateDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <KanbanBoard
        projectId={projectId}
        initialColumns={columns}
        initialTickets={tickets}
        onAddTicket={handleAddTicket}
      />

      <CreateTicketDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        members={members}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
