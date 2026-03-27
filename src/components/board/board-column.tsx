"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RequestCard } from "./request-card";
import { RequestStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface BoardColumnProps {
  id: string;
  title: string;
  requests: Request[];
  onAddRequest?: () => void;
  onRequestClick?: (requestId: string) => void;
}

export function BoardColumn({
  id,
  title,
  requests,
  onAddRequest,
  onRequestClick,
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
            {requests.length}
          </span>
        </div>
        {onAddRequest && (
          <Button variant="ghost" size="sm" onClick={onAddRequest}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext
          items={requests.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={() => onRequestClick?.(request.id)}
            />
          ))}
        </SortableContext>
        
        {requests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No requests
          </div>
        )}
      </div>
    </div>
  );
}
