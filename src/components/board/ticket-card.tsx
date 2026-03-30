"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketStatus } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical, MessageSquare, Paperclip, Clock } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
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
  _count?: {
    comments: number;
    attachments: number;
  };
  labels?: Label[];
  dueDate?: string | null;
  coverImage?: string | null;
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

// Strip markdown syntax for card preview
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "") // headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italic
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // images
    .replace(/^\s*[-*+]\s/gm, "") // list items
    .replace(/^\s*\d+\.\s/gm, "") // numbered lists
    .replace(/^\s*>\s/gm, "") // blockquotes
    .replace(/\n+/g, " ") // newlines to spaces
    .trim();
}

function getDueDateColor(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) return "bg-red-100 text-red-700";
  if (diffHours < 24) return "bg-orange-100 text-orange-700";
  if (diffHours < 72) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays}d left`;
}

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

  const commentCount = ticket._count?.comments ?? 0;
  const attachmentCount = ticket._count?.attachments ?? 0;
  const labels = ticket.labels ?? [];
  const hasDueDate = ticket.dueDate != null;
  const hasCover = ticket.coverImage != null;
  const hasDescription = ticket.description && ticket.description.trim().length > 0;
  const hasFooter =
    hasDueDate || commentCount > 0 || attachmentCount > 0 || ticket.loggedHours > 0 || ticket.estimatedHours;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border overflow-hidden hover:bg-accent/50 cursor-pointer group ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      {/* Cover image */}
      {hasCover && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={ticket.coverImage!}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start gap-1.5">
          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-block h-2 w-10 rounded-full"
                    style={{ backgroundColor: label.color }}
                    title={label.name}
                  />
                ))}
              </div>
            )}

            {/* Title */}
            <p className="font-medium text-sm leading-snug">
              {ticket.title}
            </p>

            {/* Description preview */}
            {hasDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {stripMarkdown(ticket.description!)}
              </p>
            )}

            {/* Footer with metadata */}
            {hasFooter && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {/* Due date */}
                {hasDueDate && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${getDueDateColor(
                      ticket.dueDate!
                    )}`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDueDate(ticket.dueDate!)}
                  </span>
                )}

                {/* Hours */}
                {(ticket.estimatedHours || ticket.loggedHours > 0) && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {ticket.loggedHours}
                    {ticket.estimatedHours
                      ? `/${ticket.estimatedHours}h`
                      : "h"}
                  </span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Comment count */}
                {commentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {commentCount}
                  </span>
                )}

                {/* Attachment count */}
                {attachmentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    {attachmentCount}
                  </span>
                )}

                {/* Assignee avatar */}
                {ticket.assignedTo && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={ticket.assignedTo.image || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {ticket.assignedTo.name?.[0]?.toUpperCase() ||
                        ticket.assignedTo.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
