"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Project, ProjectStatus } from "@prisma/client";
import { ProjectCard } from "./project-card";
import { toast } from "sonner";
import { Brain, Plus } from "lucide-react";

interface ProjectWithCounts extends Project {
  _count: {
    requests: number;
    members: number;
  };
}

interface ProjectListProps {
  projects: ProjectWithCounts[];
  currentUserId: string;
}

export function ProjectList({ projects, currentUserId }: ProjectListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project? This can't be undone.")) {
      return;
    }

    setDeletingId(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      toast.success("Project deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (projectId: string, currentStatus: ProjectStatus) => {
    const newStatus = currentStatus === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }

      toast.success(
        newStatus === "ARCHIVED"
          ? "Project archived"
          : "Project restored"
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
      );
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted">
            <Brain className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">Your deck is empty</h3>
        <p className="text-muted-foreground mb-4">
          Create your first project and let Brian organize the chaos.
        </p>
        <a
          href="/projects/new"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Create your first project
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isOwner={project.ownerId === currentUserId}
          onDelete={
            project.ownerId === currentUserId && deletingId !== project.id
              ? () => handleDelete(project.id)
              : undefined
          }
          onArchive={
            project.ownerId === currentUserId
              ? () => handleArchive(project.id, project.status)
              : undefined
          }
        />
      ))}
    </div>
  );
}
