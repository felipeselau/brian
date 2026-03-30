"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#000000",
];

interface CreateLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateLabelDialog({
  open,
  onOpenChange,
  projectId,
}: CreateLabelDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Label name is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create label");
      }

      toast.success("Label created");
      setName("");
      setColor(PRESET_COLORS[0]);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating label:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create label"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Label</DialogTitle>
          <DialogDescription>
            Add a new label to organize tickets in this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label-name">Name</Label>
            <Input
              id="label-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bug, Feature, Urgent..."
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                    color === presetColor
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-color">Custom Color</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full border border-border shrink-0"
                style={{ backgroundColor: color }}
              />
              <Input
                id="label-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                disabled={isLoading}
                pattern="^#[0-9a-fA-F]{6}$"
                title="Enter a valid hex color (e.g. #3b82f6)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLoading ? "Creating..." : "Create Label"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
