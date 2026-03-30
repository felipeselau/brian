import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isProjectMember } from "@/lib/permissions";
import { createChecklistSchema } from "@/lib/validations/checklist";

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
      select: { projectId: true },
    });

    if (!ticket || ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = await isProjectMember(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checklists = await prisma.checklist.findMany({
      where: { ticketId },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const data = createChecklistSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { projectId: true },
    });

    if (!ticket || ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = await isProjectMember(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxPosition = await prisma.checklist.findFirst({
      where: { ticketId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const checklist = await prisma.checklist.create({
      data: {
        title: data.title,
        ticketId,
        position: (maxPosition?.position ?? -1) + 1,
        items: data.items
          ? {
              create: data.items.map((item, index) => ({
                content: item.content,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating checklist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
