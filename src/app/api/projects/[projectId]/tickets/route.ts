import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getMemberPermissions } from "@/lib/permissions";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedHours: z.number().optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  loggedHours: z.number().optional(),
});

// GET /api/projects/[projectId]/tickets - List all tickets for project
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
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access
    const isOwner = project.ownerId === session.user.id;
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

    const tickets = await prisma.ticket.findMany({
      where: { projectId },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/tickets - Create new ticket
export async function POST(
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
    const validatedData = createTicketSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const memberPermissions = await getMemberPermissions(session.user.id, projectId);
    
    if (!memberPermissions.role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (memberPermissions.role === "WORKER" && !memberPermissions.canCreateTickets) {
      return NextResponse.json(
        { error: "Workers need permission to create tickets in this project" },
        { status: 403 }
      );
    }

    const isClient = memberPermissions.role === "CLIENT";
    const isOwner = memberPermissions.role === "OWNER";

    if (isClient) {
      if (validatedData.status && validatedData.status.toUpperCase() !== "BACKLOG") {
        return NextResponse.json(
          { error: "Clients can only create tickets in backlog" },
          { status: 403 }
        );
      }
    }

    const status = validatedData.status?.toUpperCase() || "BACKLOG";

    if (isClient && status !== "BACKLOG") {
      return NextResponse.json(
        { error: "Clients can only create tickets in backlog" },
        { status: 403 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: status as any,
        projectId,
        createdById: session.user.id,
        assignedToId: validatedData.assignedToId || null,
        estimatedHours: validatedData.estimatedHours || null,
        isClientRequest: isClient,
        approvals: {},
        lifecycleLog: [
          {
            from: "",
            to: status,
            by: session.user.id,
            at: new Date().toISOString(),
          },
        ],
      },
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
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: "Validation error", details: zodError.errors },
        { status: 400 }
      );
    }

    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}