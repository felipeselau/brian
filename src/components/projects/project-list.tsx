"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Project, ProjectStatus } from "@prisma/client";
import { ProjectCard } from "./project-card";
import { toast } from "sonner";
import { Brain, Plus } from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

interface ProjectWithCounts extends Project {
  _count: {
    tickets: number;
    members: number;
  };
}

interface ProjectListProps {
  projects: ProjectWithCounts[];
  currentUserId: string;
  isOwner: boolean;
}

export function ProjectList({ projects, currentUserId, isOwner }: ProjectListProps) {
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
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
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

      toast.success(newStatus === "ARCHIVED" ? "Project archived" : "Project restored");
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    }
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed py-16 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Brain className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="mb-1 text-lg font-semibold">Your deck is empty</h3>
        <p className="mb-4 text-muted-foreground">
          {isOwner ? (
            <>Create your first project and let Brian organize the chaos.</>
          ) : (
            <>You don&apos;t have any projects yet.</>
          )}
        </p>
        {isOwner && <CreateProjectDialog />}
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
