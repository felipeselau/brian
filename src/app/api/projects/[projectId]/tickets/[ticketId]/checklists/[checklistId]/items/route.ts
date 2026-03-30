import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isProjectMember } from "@/lib/permissions";
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "@/lib/validations/checklist";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; ticketId: string; checklistId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, ticketId, checklistId } = await params;
    const body = await req.json();
    const data = createChecklistItemSchema.parse(body);

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        ticket: {
          select: { projectId: true },
        },
      },
    });

    if (!checklist || checklist.ticketId !== ticketId) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    if (checklist.ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = await isProjectMember(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let position = data.position;
    if (position === undefined) {
      const maxPosition = await prisma.checklistItem.findFirst({
        where: { checklistId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      position = (maxPosition?.position ?? -1) + 1;
    }

    const item = await prisma.checklistItem.create({
      data: {
        content: data.content,
        checklistId,
        position,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating checklist item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; ticketId: string; checklistId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, ticketId, checklistId } = await params;
    const body = await req.json();
    const data = updateChecklistItemSchema.parse(body);

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        ticket: {
          select: { projectId: true },
        },
      },
    });

    if (!checklist || checklist.ticketId !== ticketId) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    if (checklist.ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = await isProjectMember(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingItem = await prisma.checklistItem.findUnique({
      where: { id: data.itemId },
    });

    if (!existingItem || existingItem.checklistId !== checklistId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.position !== undefined) updateData.position = data.position;

    const item = await prisma.checklistItem.update({
      where: { id: data.itemId },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error updating checklist item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; ticketId: string; checklistId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, ticketId, checklistId } = await params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        ticket: {
          select: { projectId: true },
        },
      },
    });

    if (!checklist || checklist.ticketId !== ticketId) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    if (checklist.ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = await isProjectMember(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingItem = await prisma.checklistItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem || existingItem.checklistId !== checklistId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.checklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
