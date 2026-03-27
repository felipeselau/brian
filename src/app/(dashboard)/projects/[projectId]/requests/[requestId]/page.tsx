import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestStatus } from "@prisma/client";
import { EditRequestForm } from "./edit-request-form";
import { CommentsSection } from "@/components/requests/comments-section";
import { AttachmentsSection } from "@/components/requests/attachments-section";
import { ApprovalsSection } from "./approvals-section";

const statusColors: Record<RequestStatus, string> = {
  BACKLOG: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-yellow-500",
  DONE: "bg-green-500",
  BLOCKED: "bg-red-500",
  WAITING: "bg-purple-500",
};

interface RequestPageProps {
  params: Promise<{
    projectId: string;
    requestId: string;
  }>;
}

export default async function RequestPage({ params }: RequestPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { projectId, requestId } = await params;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
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

  if (!request || request.projectId !== projectId) {
    notFound();
  }

  const isOwner = request.project.ownerId === session.user.id;
  const isMember = request.project.members.some(
    (m) => m.userId === session.user.id
  );
  const isClient = request.project.members.some(
    (m) => m.userId === session.user.id && m.role === "CLIENT"
  );

  if (!isOwner && !isMember) {
    redirect("/dashboard");
  }

  const members = request.project.members.map((m) => ({
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
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <Badge className={statusColors[request.status]} variant="default">
                {request.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              in {request.project.title}
            </p>
          </div>
          <BackButton />
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals {request.status === "REVIEW" && " ⚠️"}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({request._count.comments})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({request._count.attachments})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <EditRequestForm
              request={request as any}
              projectId={projectId}
              members={members}
              isOwner={isOwner}
              canEdit={isOwner || request.assignedToId === session.user.id || request.createdById === session.user.id}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalsSection
              requestId={request.id}
              projectId={projectId}
              approvals={request.approvals as any}
              requestStatus={request.status}
              isOwner={isOwner}
              isClient={isClient}
              clients={clients.map(c => c.user)}
              canEdit={isOwner || request.assignedToId === session.user.id || request.createdById === session.user.id}
            />
          </TabsContent>
          
          <TabsContent value="comments">
            <CommentsSection
              projectId={projectId}
              requestId={request.id}
              comments={(request.comments as any) || []}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </TabsContent>
          
          <TabsContent value="attachments">
            <AttachmentsSection
              projectId={projectId}
              requestId={request.id}
              attachments={(request.attachments as any) || []}
              isOwner={isOwner}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}