"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TicketCard } from "./ticket-card";
import { TicketStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface BoardColumnProps {
  id: string;
  title: string;
  tickets: Ticket[];
  onAddTicket?: () => void;
  onTicketClick?: (ticketId: string) => void;
}

export function BoardColumn({
  id,
  title,
  tickets,
  onAddTicket,
  onTicketClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 min-w-80 bg-gray-50 rounded-lg ${
        isOver ? "bg-gray-100" : ""
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-gray-200 px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        {onAddTicket && (
          <Button variant="ghost" size="sm" onClick={onAddTicket}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
          <SortableContext
            items={tickets.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick?.(ticket.id)}
              />
            ))}
          </SortableContext>
          
          {tickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tickets yet
            </div>
          )}
      </div>
    </div>
  );
}
