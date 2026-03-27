import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OWNER"]).optional(),
  token: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, token } = registerSchema.parse(body);

    // If token is provided, this is an invite-based registration
    if (token) {
      return await handleInviteRegistration(token, name, email, password);
    }

    // If no token, only allow owner registration
    if (!role || role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can register directly. Use an invite link to join as a worker or client." },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

async function handleInviteRegistration(
  token: string,
  name: string,
  email: string,
  password: string
) {
  // Find the invite
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid invite token" },
      { status: 400 }
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

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    // Check if user is already a member of this project
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 400 }
      );
    }

    // Add existing user as project member
    await prisma.projectMember.create({
      data: {
        projectId: invite.projectId,
        userId: existingUser.id,
        role: invite.role,
      },
    });

    // Mark invite as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json(
      {
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        message: "You have been added to the project. Please log in.",
      },
      { status: 200 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with the invite's email and role
  const user = await prisma.user.create({
    data: {
      name,
      email: invite.email, // Use email from invite
      password: hashedPassword,
      role: invite.role, // Set role from invite
    },
  });

  // Add user as project member
  await prisma.projectMember.create({
    data: {
      projectId: invite.projectId,
      userId: user.id,
      role: invite.role,
    },
  });

  // Mark invite as accepted
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Account created and added to project",
    },
    { status: 201 }
  );
}
