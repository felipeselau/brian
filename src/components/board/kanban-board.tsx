"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BoardColumn } from "./board-column";
import { RequestCard } from "./request-card";
import { RequestStatus } from "@prisma/client";

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

interface Column {
  id: string;
  title: string;
  order: number;
}

interface KanbanBoardProps {
  projectId: string;
  initialColumns: Column[];
  initialRequests: Request[];
  onAddRequest?: (columnId: string) => void;
}

const statusToColumnId: Record<string, string> = {
  BACKLOG: "backlog",
  IN_PROGRESS: "in_progress", 
  REVIEW: "review",
  DONE: "done",
  BLOCKED: "blocked",
  WAITING: "waiting",
};

export function KanbanBoard({
  projectId,
  initialColumns,
  initialRequests,
}: KanbanBoardProps) {
  const router = useRouter();
  const [columns] = useState<Column[]>(initialColumns);
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const getRequestsByColumn = (columnId: string) => {
    // Map column id to status
    const statusMap: Record<string, RequestStatus> = {
      backlog: "BACKLOG",
      in_progress: "IN_PROGRESS",
      review: "REVIEW",
      done: "DONE",
      blocked: "BLOCKED",
      waiting: "WAITING",
    };
    
    const status = statusMap[columnId] || "BACKLOG";
    return requests.filter((r) => r.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const request = requests.find((r) => r.id === event.active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveRequest(null);

    if (!over) return;

    const requestId = active.id as string;
    const request = requests.find((r) => r.id === requestId);
    
    if (!request) return;

    // Find new column from over.id
    let newStatus: RequestStatus | null = null;
    
    // Check if dropped on a column directly
    const column = columns.find((c) => c.id === over.id);
    if (column) {
      const statusMap: Record<string, RequestStatus> = {
        backlog: "BACKLOG",
        in_progress: "IN_PROGRESS",
        review: "REVIEW",
        done: "DONE",
        blocked: "BLOCKED",
        waiting: "WAITING",
      };
      newStatus = statusMap[column.id] || null;
    }

    // If not dropped on column, check which column contains the over element
    if (!newStatus) {
      const overRequest = requests.find((r) => r.id === over.id);
      if (overRequest) {
        newStatus = overRequest.status;
      }
    }

    // If we found a new status and it's different, update
    if (newStatus && newStatus !== request.status) {
      try {
        const response = await fetch(`/api/projects/${projectId}/board`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          
          // Handle business rule violations with specific messages
          if (data.code === "ESTIMATE_REQUIRED_BEFORE_START") {
            toast.error("Estimate Required", {
              description: "Add an estimate before moving to In Progress",
            });
            return;
          }
          
          if (data.code === "ESTIMATE_REQUIRED_FOR_COMPLETION") {
            toast.error("Estimate Required", {
              description: "Add an estimate before moving to Review/Done",
            });
            return;
          }
          
          throw new Error(data.error || "Failed to move request");
        }

        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: newStatus! } : r
          )
        );

        toast.success("Request moved");
        router.refresh();
      } catch (error) {
        console.error("Error moving request:", error);
        toast.error("Failed to move request");
      }
    }
  };

  const handleAddRequest = (columnId: string) => {
    // This will be handled by the RequestModal
    // For now, redirect to create
    router.push(`/projects/${projectId}/requests/new?status=${columnId}`);
  };

  const handleRequestClick = (requestId: string) => {
    router.push(`/projects/${projectId}/requests/${requestId}`);
  };

  // Sort columns by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((column) => (
          <BoardColumn
            key={column.id}
            id={column.id}
            title={column.title}
            requests={getRequestsByColumn(column.id)}
            onAddRequest={() => handleAddRequest(column.id)}
            onRequestClick={handleRequestClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRequest ? (
          <div className="opacity-80 shadow-lg">
            <RequestCard request={activeRequest} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
