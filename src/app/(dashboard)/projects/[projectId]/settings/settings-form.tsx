"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ProjectSettings {
  requireEstimateBeforeStart: boolean;
  estimateRequired: boolean;
}

interface ProjectSettingsFormProps {
  projectId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialStartDate: Date;
  initialEndDate: Date | null;
  initialStatus: string;
  initialSettings: ProjectSettings;
  isOwner: boolean;
}

export function ProjectSettingsForm({
  projectId,
  initialTitle,
  initialDescription,
  initialStartDate,
  initialEndDate,
  initialStatus,
  initialSettings,
  isOwner,
}: ProjectSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialTitle,
    description: initialDescription || "",
    startDate: new Date(initialStartDate).toISOString().split("T")[0],
    endDate: initialEndDate ? new Date(initialEndDate).toISOString().split("T")[0] : "",
    status: initialStatus,
    settings: {
      requireEstimateBeforeStart: initialSettings.requireEstimateBeforeStart ?? false,
      estimateRequired: initialSettings.estimateRequired ?? false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          status: formData.status,
          settings: formData.settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }

      toast.success("Project settings updated!");
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-muted-foreground">
          You do not have permission to edit project settings.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={!isOwner || isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          disabled={!isOwner || isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            disabled={!isOwner || isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            disabled={!isOwner || isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(v) => setFormData({ ...formData, status: v })}
          disabled={!isOwner || isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Business Rules</h3>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="requireEstimateBeforeStart">
              Require Estimate Before Starting
            </Label>
            <p className="text-sm text-muted-foreground">
              Workers must estimate hours before moving to In Progress
            </p>
          </div>
          <Switch
            id="requireEstimateBeforeStart"
            checked={formData.settings.requireEstimateBeforeStart}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                settings: { ...formData.settings, requireEstimateBeforeStart: checked },
              })
            }
            disabled={!isOwner || isLoading}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="estimateRequired">Estimate Required for Completion</Label>
            <p className="text-sm text-muted-foreground">
              Cannot move to Done without estimated hours entered
            </p>
          </div>
          <Switch
            id="estimateRequired"
            checked={formData.settings.estimateRequired}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                settings: { ...formData.settings, estimateRequired: checked },
              })
            }
            disabled={!isOwner || isLoading}
          />
        </div>
      </div>

      {isOwner && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
