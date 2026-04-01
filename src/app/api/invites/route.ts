import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createInviteSchema } from "@/lib/validations/invite";
import { resend } from "@/lib/email";
import { InviteEmail } from "@/emails/invite";
import crypto from "crypto";

// POST /api/invites - Create an invite (owner only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Validate input
    const validatedData = createInviteSchema.parse({
      email: body.email,
      role: body.role,
    });

    // Check if user is the project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        owner: { select: { name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owners can send invites" }, { status: 403 });
    }

    // Check if email is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending invite for this email+project
    const existingInvite = await prisma.invite.findUnique({
      where: {
        projectId_email: {
          projectId,
          email: validatedData.email,
        },
      },
    });

    // Check if this is a resend request
    const isResend = body.resend === true;

    if (existingInvite && existingInvite.status === "PENDING") {
      // If invite exists and is expired, OR if this is a resend request, update it
      if (existingInvite.expiresAt < new Date() || isResend) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const updatedInvite = await prisma.invite.update({
          where: { id: existingInvite.id },
          data: {
            token,
            expiresAt,
            role: validatedData.role as "WORKER" | "CLIENT",
            status: "PENDING",
          },
        });

        // Send email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
        const ownerName = project.owner.name || project.owner.email;

        await resend.emails.send({
          from: "Brian <noreply@brian.luizfelipedev.com>",
          to: [validatedData.email],
          subject: `You've been invited to join ${project.title}`,
          react: InviteEmail({
            inviteUrl,
            projectName: project.title,
            invitedBy: ownerName,
            role: validatedData.role,
          }),
        });

        return NextResponse.json(
          {
            invite: {
              id: updatedInvite.id,
              email: updatedInvite.email,
              role: updatedInvite.role,
              token: updatedInvite.token,
              status: updatedInvite.status,
            },
            inviteUrl,
          },
          { status: 200 }
        );
      }

      // Return the existing invite info so UI can show Resend option
      return NextResponse.json(
        {
          error: "An invite has already been sent to this email",
          existingInvite: {
            id: existingInvite.id,
            email: existingInvite.email,
            role: existingInvite.role,
            status: existingInvite.status,
          },
        },
        { status: 400 }
      );
    }

    // If there was a previous invite (accepted/expired), update it
    if (existingInvite) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const updatedInvite = await prisma.invite.update({
        where: { id: existingInvite.id },
        data: {
          token,
          expiresAt,
          role: validatedData.role as "WORKER" | "CLIENT",
          status: "PENDING",
        },
      });

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
      const ownerName = project.owner.name || project.owner.email;

      await resend.emails.send({
        from: "Brian <noreply@brian.luizfelipedev.com>",
        to: [validatedData.email],
        subject: `You've been invited to join ${project.title}`,
        react: InviteEmail({
          inviteUrl,
          projectName: project.title,
          invitedBy: ownerName,
          role: validatedData.role,
        }),
      });

      return NextResponse.json(
        {
          invite: {
            id: updatedInvite.id,
            email: updatedInvite.email,
            role: updatedInvite.role,
            token: updatedInvite.token,
            status: updatedInvite.status,
          },
          inviteUrl,
        },
        { status: 200 }
      );
    }

    // Create new invite
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: {
        email: validatedData.email,
        token,
        role: validatedData.role as "WORKER" | "CLIENT",
        projectId,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    // Send email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
    const ownerName = project.owner.name || project.owner.email;

    await resend.emails.send({
      from: "Brian <noreply@brian.luizfelipedev.com>",
      to: [validatedData.email],
      subject: `You've been invited to join ${project.title}`,
      react: InviteEmail({
        inviteUrl,
        projectName: project.title,
        invitedBy: ownerName,
        role: validatedData.role,
      }),
    });

    return NextResponse.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          status: invite.status,
        },
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET /api/invites?projectId=xxx - List invites for a project (owner only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Check if user is the project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owners can view invites" }, { status: 403 });
    }

    const invites = await prisma.invite.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/invites - Revoke an invite (owner only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 });
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if user is the project owner
    if (invite.project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only project owners can revoke invites" },
        { status: 403 }
      );
    }

    // Update invite status to EXPIRED (revoked)
    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ message: "Invite revoked successfully" });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
