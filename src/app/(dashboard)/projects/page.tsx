import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { UserRole, ProjectStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectsPageProps {
  searchParams: {
    status?: ProjectStatus;
  };
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const statusFilter = searchParams.status;

  // Fetch all user's projects
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
      ...(statusFilter && { status: statusFilter }),
    },
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
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Projects</h1>
            <p className="text-muted-foreground">
              Manage all your projects in one place
            </p>
          </div>
          {session.user.role === UserRole.OWNER && <CreateProjectDialog />}
        </div>

        {/* TODO: Add filter/status selector when we implement client-side filtering */}
        
        <ProjectList projects={projects} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
