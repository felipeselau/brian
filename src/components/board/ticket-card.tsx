"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketStatus } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

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

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

const statusColors: Record<TicketStatus, string> = {
  BACKLOG: "bg-gray-100 border-gray-300",
  IN_PROGRESS: "bg-blue-100 border-blue-300",
  REVIEW: "bg-yellow-100 border-yellow-300",
  DONE: "bg-green-100 border-green-300",
  BLOCKED: "bg-red-100 border-red-300",
  WAITING: "bg-purple-100 border-purple-300",
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border p-3 hover:bg-accent cursor-pointer ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{ticket.title}</p>
          {ticket.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {ticket.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {ticket.assignedTo && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={ticket.assignedTo.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {ticket.assignedTo.name?.[0] || ticket.assignedTo.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            {(ticket.estimatedHours || ticket.loggedHours) && (
              <span className="text-xs text-muted-foreground">
                {ticket.loggedHours}
                {ticket.estimatedHours ? `/${ticket.estimatedHours}h` : 'h'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
