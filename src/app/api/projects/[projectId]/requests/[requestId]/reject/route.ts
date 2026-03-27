import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const rejectSchema = z.object({
  type: z.enum(["owner", "client"]),
});

// POST /api/projects/[projectId]/requests/[requestId]/reject
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; requestId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = params;
    const body = await req.json();
    const { type } = rejectSchema.parse(body);

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!request || request.projectId !== params.projectId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Must be in REVIEW status
    if (request.status !== "REVIEW") {
      return NextResponse.json(
        { error: "Request must be in REVIEW status to reject" },
        { status: 400 }
      );
    }

    const isProjectOwner = request.project.ownerId === session.user.id;
    const isClientMember = request.project.members.some(
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
    const lifecycleLog = (request.lifecycleLog as any[]) || [];
    lifecycleLog.push({
      from: request.status,
      to: "IN_PROGRESS", // Send back to in progress after rejection
      by: session.user.id,
      at: new Date().toISOString(),
      action: `rejected_${type}`,
    });

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "IN_PROGRESS" as any,
        approvals: {} as any, // Reset approvals
        lifecycleLog,
      },
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    console.error("Error rejecting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}