import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isProjectMember } from "@/lib/permissions";

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

    await prisma.checklist.delete({
      where: { id: checklistId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting checklist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
