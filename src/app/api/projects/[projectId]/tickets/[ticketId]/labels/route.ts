import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isProjectMember } from "@/lib/permissions";
import { updateTicketLabelsSchema } from "@/lib/validations/label";

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

    const body = await req.json();
    const { labelIds } = updateTicketLabelsSchema.parse(body);

    if (labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: labelIds },
          projectId,
        },
        select: { id: true },
      });

      if (labels.length !== labelIds.length) {
        return NextResponse.json(
          { error: "One or more labels do not belong to this project" },
          { status: 400 }
        );
      }
    }

    await prisma.ticketLabel.deleteMany({
      where: { ticketId },
    });

    if (labelIds.length > 0) {
      await prisma.ticketLabel.createMany({
        data: labelIds.map((labelId) => ({ ticketId, labelId })),
      });
    }

    const updatedLabels = await prisma.ticketLabel.findMany({
      where: { ticketId },
      include: {
        label: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      labels: updatedLabels.map((tl) => tl.label),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    console.error("Error updating ticket labels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
