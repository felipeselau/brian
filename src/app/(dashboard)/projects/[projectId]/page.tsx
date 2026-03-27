import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStatus } from "@prisma/client";
import { ProjectSettings } from "@/components/projects/project-settings";
import { BoardWrapper } from "./board-wrapper";

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-500",
  ARCHIVED: "bg-gray-500",
};

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
              image: true,
            },
          },
        },
      },
      requests: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
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

        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="board">
            <BoardWrapper
              projectId={project.id}
              columns={(project.columns as any) || []}
              requests={(project.requests as any) || []}
              members={(project.members as any) || []}
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <ProjectSettings
              projectId={project.id}
              members={project.members as any}
              isOwner={isOwner}
              currentUserId={session.user.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}