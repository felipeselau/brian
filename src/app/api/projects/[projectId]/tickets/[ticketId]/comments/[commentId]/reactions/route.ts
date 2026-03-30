import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { reactionSchema, ALLOWED_EMOJIS } from "@/lib/validations/reaction";

// POST /api/projects/[projectId]/tickets/[ticketId]/comments/[commentId]/reactions - Toggle reaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, commentId } = await params;
    const body = await req.json();
    const validatedData = reactionSchema.parse(body);

    // Check if comment exists and belongs to this project
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: {
          select: { projectId: true },
        },
      },
    });

    if (!comment || comment.ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    const isOwner = project?.ownerId === session.user.id;
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Toggle reaction - if exists, remove it; if not, create it
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: session.user.id,
          emoji: validatedData.emoji,
        },
      },
    });

    if (existingReaction) {
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        action: "removed",
        emoji: validatedData.emoji,
      });
    } else {
      const reaction = await prisma.reaction.create({
        data: {
          emoji: validatedData.emoji,
          commentId,
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({
        action: "added",
        reaction,
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/tickets/[ticketId]/comments/[commentId]/reactions?emoji=👍 - Remove reaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; ticketId: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, commentId } = await params;
    const { searchParams } = new URL(req.url);
    const emoji = searchParams.get("emoji");

    if (!emoji || !(ALLOWED_EMOJIS as readonly string[]).includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Check if comment exists and belongs to this project
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: {
          select: { projectId: true },
        },
      },
    });

    if (!comment || comment.ticket.projectId !== projectId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.reaction.delete({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
