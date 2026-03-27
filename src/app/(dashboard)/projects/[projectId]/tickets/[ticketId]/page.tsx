import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketStatus } from "@prisma/client";
import { EditTicketForm } from "./edit-ticket-form";
import { CommentsSection } from "@/components/tickets/comments-section";
import { AttachmentsSection } from "@/components/tickets/attachments-section";
import { ApprovalsSection } from "./approvals-section";

const statusColors: Record<TicketStatus, string> = {
  BACKLOG: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-yellow-500",
  DONE: "bg-green-500",
  BLOCKED: "bg-red-500",
  WAITING: "bg-purple-500",
  ARCHIVED: "bg-gray-400",
};

interface TicketPageProps {
  params: Promise<{
    projectId: string;
    ticketId: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { projectId, ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      project: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      attachments: true,
      _count: {
        select: {
          comments: true,
          attachments: true,
        },
      },
    },
  });

  if (!ticket || ticket.projectId !== projectId) {
    notFound();
  }

  const isOwner = ticket.project.ownerId === session.user.id;
  const isMember = ticket.project.members.some(
    (m) => m.userId === session.user.id
  );
  const isClient = ticket.project.members.some(
    (m) => m.userId === session.user.id && m.role === "CLIENT"
  );

  if (!isOwner && !isMember) {
    redirect("/dashboard");
  }

  const members = ticket.project.members.map((m) => ({
    id: m.id,
    role: m.role,
    user: m.user,
  }));

  // Get clients for approval
  const clients = members.filter((m) => m.role === "CLIENT");

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <Badge className={statusColors[ticket.status]} variant="default">
                {ticket.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              in {ticket.project.title}
            </p>
          </div>
          <BackButton />
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals {ticket.status === "REVIEW" && " ⚠️"}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({ticket._count.comments})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({ticket._count.attachments})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <EditTicketForm
              ticket={ticket as any}
              projectId={projectId}
              members={members}
              isOwner={isOwner}
              canEdit={isOwner || ticket.assignedToId === session.user.id || ticket.createdById === session.user.id}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalsSection
              ticketId={ticket.id}
              projectId={projectId}
              approvals={ticket.approvals as any}
              ticketStatus={ticket.status}
              isOwner={isOwner}
              isClient={isClient}
              clients={clients.map(c => c.user)}
              canEdit={isOwner || ticket.assignedToId === session.user.id || ticket.createdById === session.user.id}
            />
          </TabsContent>
          
          <TabsContent value="comments">
            <CommentsSection
              projectId={projectId}
              ticketId={ticket.id}
              comments={(ticket.comments as any) || []}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </TabsContent>
          
          <TabsContent value="attachments">
            <AttachmentsSection
              projectId={projectId}
              ticketId={ticket.id}
              attachments={(ticket.attachments as any) || []}
              isOwner={isOwner}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}