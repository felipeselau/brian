"use client";

import { KanbanBoard } from "@/components/board";
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

interface BoardWrapperProps {
  projectId: string;
  columns: Column[];
  requests: Request[];
}

export function BoardWrapper({ projectId, columns, requests }: BoardWrapperProps) {
  return (
    <KanbanBoard
      projectId={projectId}
      initialColumns={columns}
      initialRequests={requests}
    />
  );
}
