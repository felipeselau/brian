import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // Fetch user's projects (owned + member)
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
      status: "ACTIVE",
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
          tickets: true,
          members: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  // Get stats
  const totalProjects = await prisma.project.count({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  const activeTickets = await prisma.ticket.count({
    where: {
      project: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      status: {
        in: ["BACKLOG", "IN_PROGRESS", "REVIEW", "BLOCKED", "WAITING"],
      },
    },
  });

  // Calculate total hours
  const tickets = await prisma.ticket.findMany({
    where: {
      project: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
    select: {
      loggedHours: true,
    },
  });

  const totalHours = tickets.reduce((sum: number, ticket) => sum + (ticket.loggedHours || 0), 0);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Deck</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}. Your second brain is ready.
            </p>
          </div>
          {session.user.role === UserRole.OWNER && <CreateProjectDialog />}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Projects</h3>
            <p className="text-2xl font-bold mt-2">{totalProjects}</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Active Briefs</h3>
            <p className="text-2xl font-bold mt-2">{activeTickets}</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Hours Logged</h3>
            <p className="text-2xl font-bold mt-2">{totalHours.toFixed(1)}h</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            {projects.length > 0 && (
              <Button variant="outline" asChild>
                <Link href="/projects">View All</Link>
              </Button>
            )}
          </div>
          <ProjectList projects={projects} currentUserId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
