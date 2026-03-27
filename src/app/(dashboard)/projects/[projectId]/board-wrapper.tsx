"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/board";
import { CreateRequestDialog } from "@/components/requests/create-request-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RequestStatus } from "@prisma/client";

interface Column {
  id: string;
  title: string;
  order: number;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  status: RequestStatus;
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
  requests: Request[];
  members: Member[];
}

export function BoardWrapper({ projectId, columns, requests, members }: BoardWrapperProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("BACKLOG");

  const handleAddRequest = (columnId: string) => {
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
          New Request
        </Button>
      </div>

      <KanbanBoard
        projectId={projectId}
        initialColumns={columns}
        initialRequests={requests}
        onAddRequest={handleAddRequest}
      />

      <CreateRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        members={members}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
