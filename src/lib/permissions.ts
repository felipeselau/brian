import { UserRole, TicketStatus } from "@prisma/client";
import prisma from "./prisma";

export type ProjectRole = "OWNER" | "WORKER" | "CLIENT" | null;

export interface ProjectWithMembers {
  ownerId: string;
  members: {
    userId: string;
    role: UserRole;
    canCreateTickets: boolean;
  }[];
}

export async function getProjectRole(
  userId: string,
  project: ProjectWithMembers
): Promise<ProjectRole> {
  if (project.ownerId === userId) {
    return "OWNER";
  }

  const member = project.members.find((m) => m.userId === userId);
  if (!member) {
    return null;
  }

  return member.role as ProjectRole;
}

export async function getMemberPermissions(
  userId: string,
  projectId: string
): Promise<{ role: ProjectRole; canCreateTickets: boolean }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      members: {
        select: {
          userId: true,
          role: true,
          canCreateTickets: true,
        },
      },
    },
  });

  if (!project) {
    return { role: null, canCreateTickets: false };
  }

  if (project.ownerId === userId) {
    return { role: "OWNER", canCreateTickets: true };
  }

  const member = project.members.find((m) => m.userId === userId);
  if (!member) {
    return { role: null, canCreateTickets: false };
  }

  return {
    role: member.role as ProjectRole,
    canCreateTickets: member.canCreateTickets,
  };
}

export async function isProjectMember(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return false;
  if (project.ownerId === userId) return true;

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return !!member;
}

export async function canUserCreateTickets(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { role, canCreateTickets } = await getMemberPermissions(userId, projectId);

  if (role === "OWNER") return true;
  if (role === "CLIENT") return true;
  if (role === "WORKER" && canCreateTickets) return true;

  return false;
}

export async function canUserUpdateTicket(
  userId: string,
  ticket: {
    createdById: string;
    assignedToId: string | null;
  },
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);

  if (role === "OWNER") return true;
  if (role === "CLIENT" && ticket.createdById === userId) return true;
  if (role === "WORKER" && (ticket.assignedToId === userId || ticket.createdById === userId)) return true;

  return false;
}

export async function canUserHardDeleteTicket(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);
  return role === "OWNER";
}

export async function canUserSoftDeleteTicket(
  userId: string,
  ticket: {
    createdById: string;
    assignedToId: string | null;
  },
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);

  if (role === "OWNER") return true;
  if (role === "WORKER" && (ticket.assignedToId === userId || ticket.createdById === userId)) return true;

  return false;
}

export async function canUserMoveTicket(
  userId: string,
  ticket: {
    createdById: string;
    assignedToId: string | null;
  },
  projectId: string,
  fromStatus: TicketStatus,
  toStatus: TicketStatus
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);

  if (role === "OWNER") return true;

  if (role === "CLIENT") {
    return fromStatus === "REVIEW" && toStatus === "DONE";
  }

  if (role === "WORKER") {
    const isAssignedOrCreator = ticket.assignedToId === userId || ticket.createdById === userId;
    if (!isAssignedOrCreator) return false;

    const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
      BACKLOG: ["IN_PROGRESS"],
      IN_PROGRESS: ["REVIEW", "BLOCKED", "WAITING"],
      REVIEW: [],
      DONE: [],
      BLOCKED: ["IN_PROGRESS"],
      WAITING: ["IN_PROGRESS"],
      ARCHIVED: [],
    };

    return allowedTransitions[fromStatus]?.includes(toStatus) ?? false;
  }

  return false;
}

export async function canUserUpdateProjectSettings(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);
  return role === "OWNER";
}

export async function canUserManageMembers(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);
  return role === "OWNER";
}

export async function canUserDeleteProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { role } = await getMemberPermissions(userId, projectId);
  return role === "OWNER";
}
