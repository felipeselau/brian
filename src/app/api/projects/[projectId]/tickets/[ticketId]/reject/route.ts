import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const rejectSchema = z.object({
  type: z.enum(["owner", "client"]),
});

// POST /api/projects/[projectId]/tickets/[ticketId]/reject
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, ticketId } = await params;
    const body = await req.json();
    const { type } = rejectSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!ticket || ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Must be in REVIEW status
    if (ticket.status !== "REVIEW") {
      return NextResponse.json(
        { error: "Ticket must be in REVIEW status to reject" },
        { status: 400 }
      );
    }

    const isProjectOwner = ticket.project.ownerId === session.user.id;
    const isClientMember = ticket.project.members.some(
      (m) => m.userId === session.user.id && m.role === "CLIENT"
    );

    // Check permissions
    if (type === "owner" && !isProjectOwner) {
      return NextResponse.json(
        { error: "Only project owner can reject as owner" },
        { status: 403 }
      );
    }

    if (type === "client" && !isClientMember) {
      return NextResponse.json(
        { error: "Only clients can reject as client" },
        { status: 403 }
      );
    }

    // Update lifecycle log
    const lifecycleLog = (ticket.lifecycleLog as any[]) || [];
    lifecycleLog.push({
      from: ticket.status,
      to: "IN_PROGRESS", // Send back to in progress after rejection
      by: session.user.id,
      at: new Date().toISOString(),
      action: `rejected_${type}`,
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "IN_PROGRESS" as any,
        approvals: {} as any, // Reset approvals
        lifecycleLog,
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid ticket" }, { status: 400 });
    }

    console.error("Error rejecting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}