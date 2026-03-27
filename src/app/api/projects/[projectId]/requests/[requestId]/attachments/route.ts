import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createAttachmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  size: z.number().optional(),
  type: z.string().optional(),
});

// GET /api/projects/[projectId]/requests/[requestId]/attachments - List attachments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { project: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isOwner = request.project.ownerId === session.user.id;
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: request.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachments = await prisma.attachment.findMany({
      where: { requestId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/requests/[requestId]/attachments - Add attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await req.json();
    const validatedData = createAttachmentSchema.parse(body);

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { project: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isOwner = request.project.ownerId === session.user.id;
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: request.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachment = await prisma.attachment.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        size: validatedData.size,
        type: validatedData.type,
        requestId,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/requests/[requestId]/attachments?attachmentId=... - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        request: {
          include: { project: true },
        },
      },
    });

    if (!attachment || attachment.request.projectId !== projectId) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Only project owner or the person who uploaded can delete (no userId on attachment, so just owner)
    const isProjectOwner = attachment.request.project.ownerId === session.user.id;

    if (!isProjectOwner) {
      return NextResponse.json(
        { error: "Only project owner can delete attachments" },
        { status: 403 }
      );
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}