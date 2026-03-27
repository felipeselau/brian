import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/invites/[token] - Validate invite token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        project: invite.project,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
