"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelManagerProps {
  projectId: string;
  ticketId: string;
  currentLabels: Label[];
  availableLabels: Label[];
  canEdit: boolean;
}

export function LabelManager({
  projectId,
  ticketId,
  currentLabels,
  availableLabels,
  canEdit,
}: LabelManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [labels, setLabels] = useState<Label[]>(currentLabels);

  const currentIds = new Set(labels.map((l) => l.id));
  const unassigned = availableLabels.filter((l) => !currentIds.has(l.id));

  const updateLabels = async (newLabels: Label[]) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/labels`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelIds: newLabels.map((l) => l.id) }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update labels");
      }

      const data = await response.json();
      setLabels(data.labels);
      router.refresh();
    } catch (error) {
      console.error("Error updating labels:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update labels"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeLabel = (labelId: string) => {
    const newLabels = labels.filter((l) => l.id !== labelId);
    setLabels(newLabels);
    updateLabels(newLabels);
  };

  const addLabel = (label: Label) => {
    const newLabels = [...labels, label];
    setLabels(newLabels);
    updateLabels(newLabels);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
          {canEdit && (
            <button
              type="button"
              onClick={() => removeLabel(label.id)}
              disabled={isLoading}
              className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {unassigned.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No labels available
              </div>
            ) : (
              unassigned.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  onClick={() => addLabel(label)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="truncate">{label.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
