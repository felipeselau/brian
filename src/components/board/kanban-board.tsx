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
import { TicketCard } from "./ticket-card";
import { TicketStatus } from "@prisma/client";

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

interface Column {
  id: string;
  title: string;
  order: number;
}

interface KanbanBoardProps {
  projectId: string;
  initialColumns: Column[];
  initialTickets: Ticket[];
  onAddTicket?: (columnId: string) => void;
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
  initialTickets,
}: KanbanBoardProps) {
  const router = useRouter();
  const [columns] = useState<Column[]>(initialColumns);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

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
    setTickets(initialTickets);
  }, [initialTickets]);

  const getTicketsByColumn = (columnId: string) => {
    // Map column id to status
    const statusMap: Record<string, TicketStatus> = {
      backlog: "BACKLOG",
      in_progress: "IN_PROGRESS",
      review: "REVIEW",
      done: "DONE",
      blocked: "BLOCKED",
      waiting: "WAITING",
    };
    
    const status = statusMap[columnId] || "BACKLOG";
    return tickets.filter((r) => r.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((r) => r.id === event.active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const ticket = tickets.find((r) => r.id === ticketId);
    
    if (!ticket) return;

    // Find new column from over.id
    let newStatus: TicketStatus | null = null;
    
    // Check if dropped on a column directly
    const column = columns.find((c) => c.id === over.id);
    if (column) {
      const statusMap: Record<string, TicketStatus> = {
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
      const overTicket = tickets.find((r) => r.id === over.id);
      if (overTicket) {
        newStatus = overTicket.status;
      }
    }

    // If we found a new status and it's different, update
    if (newStatus && newStatus !== ticket.status) {
      try {
        const response = await fetch(`/api/projects/${projectId}/board`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
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
          
          throw new Error(data.error || "Failed to move ticket");
        }

        // Update local state
        setTickets((prev) =>
          prev.map((r) =>
            r.id === ticketId ? { ...r, status: newStatus! } : r
          )
        );

        toast.success("Ticket moved");
        router.refresh();
      } catch (error) {
        console.error("Error moving ticket:", error);
        toast.error("Failed to move ticket");
      }
    }
  };

  const handleAddTicket = (columnId: string) => {
    // This will be handled by the TicketModal
    // For now, redirect to create
    router.push(`/projects/${projectId}/tickets/new?status=${columnId}`);
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/projects/${projectId}/tickets/${ticketId}`);
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
            tickets={getTicketsByColumn(column.id)}
            onAddTicket={() => handleAddTicket(column.id)}
            onTicketClick={handleTicketClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="opacity-80 shadow-lg">
            <TicketCard ticket={activeTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
