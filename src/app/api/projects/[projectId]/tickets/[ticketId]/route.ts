import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  loggedHours: z.number().optional(),
});

// GET /api/projects/[projectId]/tickets/[ticketId] - Get single ticket
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
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
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user has access
    const isOwner = ticket.project.ownerId === session.user.id;
    const isMember = ticket.project.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/tickets/[ticketId] - Update ticket
export async function PATCH(
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

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { project: true },
    });

    if (!existingTicket || existingTicket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = existingTicket.project.ownerId === session.user.id;
    const isAssigned = existingTicket.assignedToId === session.user.id;
    const isCreator = existingTicket.createdById === session.user.id;

    if (!isOwner && !isAssigned && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to update this ticket" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    const lifecycleLog = existingTicket.lifecycleLog as any[] || [];

    // Handle status change
    if (body.status && body.status.toUpperCase() !== existingTicket.status) {
      const newStatus = body.status.toUpperCase();
      updateData.status = newStatus;
      lifecycleLog.push({
        from: existingTicket.status,
        to: newStatus,
        by: session.user.id,
        at: new Date().toISOString(),
      });
    }

    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;
    if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
    if (body.loggedHours !== undefined) updateData.loggedHours = body.loggedHours;

    updateData.lifecycleLog = lifecycleLog;

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
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

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid ticket data" },
        { status: 400 }
      );
    }

    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/tickets/[ticketId] - Delete ticket
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, ticketId } = await params;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { project: true },
    });

    if (!existingTicket || existingTicket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Only owner can delete tickets
    if (existingTicket.project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the project owner can delete tickets" },
        { status: 403 }
      );
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}