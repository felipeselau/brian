import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectStatus } from "@prisma/client";

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-500",
  ARCHIVED: "bg-gray-500",
};

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          requests: true,
          members: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user has access
  const isOwner = project.ownerId === session.user.id;
  const isMember = project.members.some((m: any) => m.userId === session.user.id);

  if (!isOwner && !isMember) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Badge className={statusColors[project.status]} variant="default">
              {statusLabels[project.status]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Owner: {project.owner.name} ({project.owner.email})
            </p>
            <p>Members: {project._count.members}</p>
            <p>Requests: {project._count.requests}</p>
          </div>
        </div>

        {/* Kanban board will be added in FASE 7-8 */}
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <p>Kanban board will be implemented in Phase 7-8</p>
        </div>
      </div>
    </div>
  );
}
