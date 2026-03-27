import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

// GET /api/projects/[projectId]/requests/[requestId]/comments - List comments
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; requestId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = params;

    // Check if request exists
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { project: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check access
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

    const comments = await prisma.comment.findMany({
      where: { requestId },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/requests/[requestId]/comments - Add comment
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
    const validatedData = createCommentSchema.parse(body);

    // Check if request exists
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { project: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check access - project member
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

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        requestId,
        userId: session.user.id,
      },
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
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/requests/[requestId]/comments/[commentId] - Delete comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; requestId: string; commentId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = params;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        request: {
          include: { project: true },
        },
      },
    });

    if (!comment || comment.request.projectId !== params.projectId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permissions - only comment author or project owner can delete
    const isProjectOwner = comment.request.project.ownerId === session.user.id;
    const isCommentAuthor = comment.userId === session.user.id;

    if (!isProjectOwner && !isCommentAuthor) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}