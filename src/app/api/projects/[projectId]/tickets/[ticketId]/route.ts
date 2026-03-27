import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canUserUpdateTicket,
  canUserMoveTicket,
  canUserSoftDeleteTicket,
  canUserHardDeleteTicket,
  getMemberPermissions,
} from "@/lib/permissions";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  loggedHours: z.number().optional(),
});

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
          take: 10,
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

    const canUpdate = await canUserUpdateTicket(
      session.user.id,
      existingTicket,
      projectId
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "You don't have permission to update this ticket" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    const lifecycleLog = (existingTicket.lifecycleLog as any[]) || [];

    if (body.status && body.status.toUpperCase() !== existingTicket.status) {
      const newStatus = body.status.toUpperCase() as TicketStatus;

      const canMove = await canUserMoveTicket(
        session.user.id,
        existingTicket,
        projectId,
        existingTicket.status,
        newStatus
      );

      if (!canMove) {
        const memberPerms = await getMemberPermissions(session.user.id, projectId);
        
        if (memberPerms.role === "CLIENT") {
          return NextResponse.json(
            { error: "Clients can only move tickets from review to done" },
            { status: 403 }
          );
        }
        
        if (memberPerms.role === "WORKER") {
          return NextResponse.json(
            { error: "You cannot move tickets to this status" },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: "You cannot move tickets to this status" },
          { status: 403 }
        );
      }

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

    const canHardDelete = await canUserHardDeleteTicket(session.user.id, projectId);
    const canSoftDelete = await canUserSoftDeleteTicket(session.user.id, existingTicket, projectId);

    if (canHardDelete) {
      await prisma.ticket.delete({
        where: { id: ticketId },
      });
      return NextResponse.json({ success: true, deleted: "hard" });
    }

    if (canSoftDelete) {
      const lifecycleLog = (existingTicket.lifecycleLog as any[]) || [];
      lifecycleLog.push({
        action: "ARCHIVED",
        from: existingTicket.status,
        to: "ARCHIVED",
        by: session.user.id,
        at: new Date().toISOString(),
      });

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "ARCHIVED",
          lifecycleLog,
        },
      });
      return NextResponse.json({ success: true, deleted: "soft" });
    }

    return NextResponse.json(
      { error: "You don't have permission to delete this ticket" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
