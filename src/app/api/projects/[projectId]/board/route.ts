import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const moveRequestSchema = z.object({
  requestId: z.string(),
  status: z.string().optional(),
  position: z.number().optional(),
});

// GET /api/projects/[projectId]/board - Get board with columns and requests
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
        requests: {
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
      requests: project.requests,
    });
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/board - Move request to column
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
    const validatedData = moveRequestSchema.parse(body);

    // Check if request exists and belongs to project
    const request = await prisma.request.findUnique({
      where: { id: validatedData.requestId },
      include: {
        project: true,
      },
    });

    if (!request || request.projectId !== projectId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check permissions: owner, assigned worker, or createdBy can move
    const isOwner = request.project.ownerId === session.user.id;
    const isAssigned = request.assignedToId === session.user.id;
    const isCreator = request.createdById === session.user.id;

    if (!isOwner && !isAssigned && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to move this request" },
        { status: 403 }
      );
    }

    // Get project settings for business rules enforcement
    const settings = (request.project.settings as { requireEstimateBeforeStart?: boolean; estimateRequired?: boolean }) || {};
    const newStatus = validatedData.status?.toUpperCase();

    // Business Rule: requireEstimateBeforeStart
    // Cannot move to IN_PROGRESS without an estimate
    if (
      settings.requireEstimateBeforeStart &&
      newStatus === "IN_PROGRESS" &&
      request.status !== "IN_PROGRESS" &&
      request.estimatedHours === null
    ) {
      return NextResponse.json(
        { 
          error: "Estimate required before starting work",
          code: "ESTIMATE_REQUIRED_BEFORE_START",
          message: "This project requires an estimate before moving requests to In Progress. Please add an estimated hours value first."
        },
        { status: 400 }
      );
    }

    // Business Rule: estimateRequired
    // Cannot move to DONE or REVIEW without an estimate
    if (
      settings.estimateRequired &&
      (newStatus === "DONE" || newStatus === "REVIEW") &&
      request.status !== "DONE" &&
      request.status !== "REVIEW" &&
      request.estimatedHours === null
    ) {
      return NextResponse.json(
        { 
          error: "Estimate required for completion",
          code: "ESTIMATE_REQUIRED_FOR_COMPLETION",
          message: "This project requires an estimate before completing requests. Please add an estimated hours value first."
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const lifecycleLog = (request.lifecycleLog as Array<{ from: string; to: string; by: string; at: string }>) || [];

    if (newStatus && newStatus !== request.status) {
      updateData.status = newStatus;
      // Append to lifecycle log
      lifecycleLog.push({
        from: request.status,
        to: newStatus,
        by: session.user.id,
        at: new Date().toISOString(),
      });
      updateData.lifecycleLog = lifecycleLog;
    }

    if (validatedData.position !== undefined) {
      updateData.position = validatedData.position;
    }

    const updatedRequest = await prisma.request.update({
      where: { id: validatedData.requestId },
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

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    console.error("Error moving request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}