"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2 } from "lucide-react";

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
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    ownerId: string;
  };
}

interface EditRequestFormProps {
  request: Request;
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

export function EditRequestForm({
  request,
  projectId,
  members,
  isOwner,
  canEdit,
}: EditRequestFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description || "",
    status: request.status,
    assignedToId: request.assignedTo?.id || "",
    estimatedHours: request.estimatedHours?.toString() || "",
    loggedHours: request.loggedHours?.toString() || "0",
  });

  const workers = members.filter((m) => m.role === "WORKER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          loggedHours: formData.loggedHours ? parseFloat(formData.loggedHours) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update request");
      }

      toast.success("Request updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/requests/${request.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete request");
      }

      toast.success("Request deleted successfully!");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete request"
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          disabled={!canEdit || isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v as RequestStatus })}
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
              <SelectItem value="">Unassigned</SelectItem>
              {workers.map((w) => (
                <SelectItem key={w.user.id} value={w.user.id}>
                  {w.user.name || w.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            Created by: {request.createdBy.name || request.createdBy.email}
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
