"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2, Calendar } from "lucide-react";

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

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  estimatedHours: number | null;
  loggedHours: number;
  dueDate?: string | Date | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    ownerId: string;
  };
}

interface EditTicketFormProps {
  ticket: Ticket;
  projectId: string;
  members: Member[];
  isOwner: boolean;
  canEdit: boolean;
}

const statusOptions = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "WAITING", label: "Waiting" },
];

export function EditTicketForm({
  ticket,
  projectId,
  members,
  isOwner,
  canEdit,
}: EditTicketFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description || "",
    status: ticket.status,
    assignedToId: ticket.assignedTo?.id || "",
    estimatedHours: ticket.estimatedHours?.toString() || "",
    loggedHours: ticket.loggedHours?.toString() || "0",
    dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split("T")[0] : "",
  });

  const workers = members.filter((m) => m.role === "WORKER");

  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { attachments } = await response.json();
      return attachments[0]?.url;
    },
    [projectId, ticket.id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedToId: formData.assignedToId === "__unassigned__" || formData.assignedToId === "" ? null : formData.assignedToId,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          loggedHours: formData.loggedHours ? parseFloat(formData.loggedHours) : undefined,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update ticket");
      }

      toast.success("Ticket updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update ticket"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tickets/${ticket.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete ticket");
      }

      toast.success("Ticket deleted successfully!");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete ticket"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={!canEdit || isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <MarkdownEditor
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="Add a description... (Markdown supported)"
          disabled={!canEdit || isLoading}
          minRows={4}
          maxRows={12}
          showPreview={true}
          onImageUpload={handleImageUpload}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v as TicketStatus })}
            disabled={!canEdit || isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assign to</Label>
          <Select
            value={formData.assignedToId}
            onValueChange={(v) => setFormData({ ...formData, assignedToId: v })}
            disabled={!canEdit || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {workers.map((w) => (
                <SelectItem key={w.user.id} value={w.user.id}>
                  {w.user.name || w.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            disabled={!canEdit || isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            disabled={!canEdit || isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loggedHours">Logged Hours</Label>
          <Input
            id="loggedHours"
            type="number"
            min="0"
            step="0.5"
            value={formData.loggedHours}
            onChange={(e) => setFormData({ ...formData, loggedHours: e.target.value })}
            disabled={!canEdit || isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">
            Created by: {ticket.createdBy.name || ticket.createdBy.email}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          )}
          {canEdit && (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
