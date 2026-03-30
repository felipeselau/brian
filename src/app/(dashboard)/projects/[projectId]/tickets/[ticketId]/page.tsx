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
import { LabelManager } from "@/components/tickets/label-manager";
import { ChecklistSection } from "@/components/tickets/checklist-section";
import { Clock, Calendar } from "lucide-react";

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
          labels: {
            orderBy: { createdAt: "asc" },
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
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      attachments: true,
      ticketLabels: {
        include: {
          label: true,
        },
      },
      checklists: {
        include: {
          items: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
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

  const clients = members.filter((m) => m.role === "CLIENT");
  const canEdit = isOwner || ticket.assignedToId === session.user.id || ticket.createdById === session.user.id;

  // Current labels on the ticket
  const currentLabels = ticket.ticketLabels.map((tl) => tl.label);

  // Available labels for the project
  const availableLabels = ticket.project.labels;

  // Checklists counts for summary
  const totalChecklistItems = ticket.checklists.reduce((acc, cl) => acc + cl.items.length, 0);
  const completedChecklistItems = ticket.checklists.reduce(
    (acc, cl) => acc + cl.items.filter((item) => item.completed).length,
    0
  );

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
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
              <div className="space-y-6">
                {/* Description */}
                <EditTicketForm
                  ticket={ticket as any}
                  projectId={projectId}
                  members={members}
                  isOwner={isOwner}
                  canEdit={canEdit}
                />
              </div>
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
                canEdit={canEdit}
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

        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-6">
          {/* Labels */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Labels</h3>
            <LabelManager
              projectId={projectId}
              ticketId={ticket.id}
              currentLabels={currentLabels}
              availableLabels={availableLabels}
              canEdit={canEdit}
            />
          </div>

          {/* Due date display */}
          {ticket.dueDate && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(ticket.dueDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          )}

          {/* Hours summary */}
          {(ticket.estimatedHours || ticket.loggedHours > 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Time Tracking</h3>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {ticket.loggedHours}h logged
                {ticket.estimatedHours && ` / ${ticket.estimatedHours}h estimated`}
              </div>
            </div>
          )}

          {/* Checklists */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Checklists {totalChecklistItems > 0 && `(${completedChecklistItems}/${totalChecklistItems})`}
            </h3>
            <ChecklistSection
              projectId={projectId}
              ticketId={ticket.id}
              checklists={(ticket.checklists as any) || []}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
