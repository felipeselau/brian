import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canUserMoveTicket } from "@/lib/permissions";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";

const moveTicketSchema = z.object({
  ticketId: z.string(),
  status: z.string().optional(),
  position: z.number().optional(),
});

// GET /api/projects/[projectId]/board - Get board with columns and tickets
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        tickets: {
          orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
          include: {
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
            _count: {
              select: {
                comments: true,
                attachments: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access
    const isOwner = project.ownerId === session.user.id;
    const isMember = project.members.some((m) => m.userId === session.user.id);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        columns: project.columns,
        settings: project.settings,
      },
      tickets: project.tickets,
    });
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/board - Move ticket to column
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const validatedData = moveTicketSchema.parse(body);

    // Check if ticket exists and belongs to project
    const ticket = await prisma.ticket.findUnique({
      where: { id: validatedData.ticketId },
      include: {
        project: true,
      },
    });

    if (!ticket || ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newStatus = validatedData.status?.toUpperCase() as TicketStatus | undefined;

    if (newStatus && newStatus !== ticket.status) {
      const canMove = await canUserMoveTicket(
        session.user.id,
        ticket,
        projectId,
        ticket.status,
        newStatus
      );

      if (!canMove) {
        return NextResponse.json(
          { error: "You don't have permission to move this ticket to this status" },
          { status: 403 }
        );
      }
    }

    // Get project settings for business rules enforcement
    const settings = (ticket.project.settings as { requireEstimateBeforeStart?: boolean; estimateRequired?: boolean }) || {};

    // Business Rule: requireEstimateBeforeStart
    // Cannot move to IN_PROGRESS without an estimate
    if (
      settings.requireEstimateBeforeStart &&
      newStatus === "IN_PROGRESS" &&
      ticket.status !== "IN_PROGRESS" &&
      ticket.estimatedHours === null
    ) {
      return NextResponse.json(
        { 
          error: "Estimate required before starting work",
          code: "ESTIMATE_REQUIRED_BEFORE_START",
          message: "This project requires an estimate before moving tickets to In Progress. Please add an estimated hours value first."
        },
        { status: 400 }
      );
    }

    // Business Rule: estimateRequired
    // Cannot move to DONE or REVIEW without an estimate
    if (
      settings.estimateRequired &&
      (newStatus === "DONE" || newStatus === "REVIEW") &&
      ticket.status !== "DONE" &&
      ticket.status !== "REVIEW" &&
      ticket.estimatedHours === null
    ) {
      return NextResponse.json(
        { 
          error: "Estimate required for completion",
          code: "ESTIMATE_REQUIRED_FOR_COMPLETION",
          message: "This project requires an estimate before completing tickets. Please add an estimated hours value first."
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const lifecycleLog = (ticket.lifecycleLog as Array<{ from: string; to: string; by: string; at: string }>) || [];

    if (newStatus && newStatus !== ticket.status) {
      updateData.status = newStatus;
      // Append to lifecycle log
      lifecycleLog.push({
        from: ticket.status,
        to: newStatus,
        by: session.user.id,
        at: new Date().toISOString(),
      });
      updateData.lifecycleLog = lifecycleLog;
    }

    if (validatedData.position !== undefined) {
      updateData.position = validatedData.position;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: validatedData.ticketId },
      data: updateData,
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
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid ticket data", details: error },
        { status: 400 }
      );
    }

    console.error("Error moving ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}