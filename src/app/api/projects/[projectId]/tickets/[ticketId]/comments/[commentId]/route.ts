import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateCommentSchema } from "@/lib/validations/comment";

// PATCH /api/projects/[projectId]/tickets/[ticketId]/comments/[commentId] - Edit comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;
    const body = await req.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: {
          include: { project: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permissions - only comment author or project owner can edit
    const isProjectOwner = comment.ticket.project.ownerId === session.user.id;
    const isCommentAuthor = comment.userId === session.user.id;

    if (!isProjectOwner && !isCommentAuthor) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        mentions: validatedData.mentions.length > 0 ? validatedData.mentions : undefined,
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

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
