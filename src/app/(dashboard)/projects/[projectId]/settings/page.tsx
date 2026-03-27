import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectSettingsForm } from "./settings-form";

interface SettingsPageProps {
  params: {
    projectId: string;
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
  });

  if (!project) {
    redirect("/projects");
  }

  const isOwner = project.ownerId === session.user.id;

  if (!isOwner) {
    redirect(`/projects/${params.projectId}`);
  }

  const projectSettings = project.settings as any;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Project Settings</h1>
      
      <ProjectSettingsForm
        projectId={project.id}
        initialTitle={project.title}
        initialDescription={project.description}
        initialStartDate={project.startDate}
        initialEndDate={project.endDate}
        initialStatus={project.status}
        initialSettings={projectSettings || {}}
        isOwner={isOwner}
      />
    </div>
  );
}