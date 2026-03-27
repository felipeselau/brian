import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const approvalSchema = z.object({
  type: z.enum(["owner", "client"]),
});

// POST /api/projects/[projectId]/tickets/[ticketId]/approve
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
    const { type } = approvalSchema.parse(body);

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
        { error: "Ticket must be in REVIEW status to approve" },
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
        { error: "Only project owner can approve as owner" },
        { status: 403 }
      );
    }

    if (type === "client" && !isClientMember) {
      return NextResponse.json(
        { error: "Only clients can approve as client" },
        { status: 403 }
      );
    }

    // Get current approvals
    const currentApprovals = (ticket.approvals as any) || {};

    // For client approval, owner must approve first
    if (type === "client" && !currentApprovals.owner) {
      return NextResponse.json(
        { error: "Owner must approve before client can approve" },
        { status: 400 }
      );
    }

    // Update approvals
    const newApprovals = {
      ...currentApprovals,
      [type]: true,
    };

    // Check if all approvals are done → move to DONE
    const currentStatus = ticket.status;
    let newStatus: "REVIEW" | "DONE" = "REVIEW";
    if (newApprovals.owner && newApprovals.client) {
      newStatus = "DONE";
    }

    // Update lifecycle log
    const lifecycleLog = (ticket.lifecycleLog as any[]) || [];
    lifecycleLog.push({
      from: currentStatus,
      to: newStatus,
      by: session.user.id,
      at: new Date().toISOString(),
      action: `approved_${type}`,
    });

    const updateData: any = {
      approvals: newApprovals,
      status: newStatus,
      lifecycleLog,
    };

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid ticket" }, { status: 400 });
    }

    console.error("Error approving:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}