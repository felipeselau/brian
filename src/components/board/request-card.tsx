"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RequestStatus } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

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

interface RequestCardProps {
  request: Request;
  onClick?: () => void;
}

const statusColors: Record<RequestStatus, string> = {
  BACKLOG: "bg-gray-100 border-gray-300",
  IN_PROGRESS: "bg-blue-100 border-blue-300",
  REVIEW: "bg-yellow-100 border-yellow-300",
  DONE: "bg-green-100 border-green-300",
  BLOCKED: "bg-red-100 border-red-300",
  WAITING: "bg-purple-100 border-purple-300",
};

export function RequestCard({ request, onClick }: RequestCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

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
          <p className="font-medium text-sm truncate">{request.title}</p>
          {request.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {request.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {request.assignedTo && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={request.assignedTo.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {request.assignedTo.name?.[0] || request.assignedTo.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            {(request.estimatedHours || request.loggedHours) && (
              <span className="text-xs text-muted-foreground">
                {request.loggedHours}
                {request.estimatedHours ? `/${request.estimatedHours}h` : 'h'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
