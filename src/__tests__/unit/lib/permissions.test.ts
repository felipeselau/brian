import { describe, it, expect, beforeEach } from "vitest";
import { TicketStatus } from "@prisma/client";
import {
  getProjectRole,
  getMemberPermissions,
  isProjectMember,
  canUserCreateTickets,
  canUserUpdateTicket,
  canUserHardDeleteTicket,
  canUserSoftDeleteTicket,
  canUserMoveTicket,
  canUserUpdateProjectSettings,
  canUserManageMembers,
  canUserDeleteProject,
  ProjectWithMembers,
} from "@/lib/permissions";
import { seedTestData, resetDatabase, prismaTest } from "@/__tests__/setup/test-db";

describe("Permissions", () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    testData = await seedTestData();
  });

  describe("getProjectRole", () => {
    it("returns OWNER for project owner", async () => {
      const project = (await prismaTest.project.findUnique({
        where: { id: testData.projects.projectAlpha.id },
        select: {
          ownerId: true,
          members: { select: { userId: true, role: true, canCreateTickets: true } },
        },
      })) as ProjectWithMembers;

      const role = await getProjectRole(testData.users.alice.id, project);
      expect(role).toBe("OWNER");
    });

    it("returns WORKER for worker member", async () => {
      const project = (await prismaTest.project.findUnique({
        where: { id: testData.projects.projectAlpha.id },
        select: {
          ownerId: true,
          members: { select: { userId: true, role: true, canCreateTickets: true } },
        },
      })) as ProjectWithMembers;

      const role = await getProjectRole(testData.users.bob.id, project);
      expect(role).toBe("WORKER");
    });

    it("returns CLIENT for client member", async () => {
      const project = (await prismaTest.project.findUnique({
        where: { id: testData.projects.projectAlpha.id },
        select: {
          ownerId: true,
          members: { select: { userId: true, role: true, canCreateTickets: true } },
        },
      })) as ProjectWithMembers;

      const role = await getProjectRole(testData.users.diana.id, project);
      expect(role).toBe("CLIENT");
    });

    it("returns null for non-member", async () => {
      const nonMember = await prismaTest.user.create({
        data: {
          email: "nonmember@test.com",
          password: "hashedpassword",
          name: "Non Member",
        },
      });

      const project = (await prismaTest.project.findUnique({
        where: { id: testData.projects.projectAlpha.id },
        select: {
          ownerId: true,
          members: { select: { userId: true, role: true, canCreateTickets: true } },
        },
      })) as ProjectWithMembers;

      const role = await getProjectRole(nonMember.id, project);
      expect(role).toBeNull();
    });
  });

  describe("getMemberPermissions", () => {
    it("returns correct permissions for OWNER", async () => {
      const perms = await getMemberPermissions(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(perms).toEqual({
        role: "OWNER",
        canCreateTickets: true,
      });
    });

    it("returns correct permissions for CLIENT", async () => {
      const perms = await getMemberPermissions(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(perms).toEqual({
        role: "CLIENT",
        canCreateTickets: true,
      });
    });

    it("returns correct permissions for WORKER with canCreateTickets=true", async () => {
      const perms = await getMemberPermissions(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(perms).toEqual({
        role: "WORKER",
        canCreateTickets: true,
      });
    });

    it("returns correct permissions for WORKER with canCreateTickets=false", async () => {
      const perms = await getMemberPermissions(
        testData.users.charlie.id,
        testData.projects.projectAlpha.id
      );
      expect(perms).toEqual({
        role: "WORKER",
        canCreateTickets: false,
      });
    });

    it("returns null role for non-member", async () => {
      const nonMember = await prismaTest.user.create({
        data: {
          email: "nonmember2@test.com",
          password: "hashedpassword",
          name: "Non Member 2",
        },
      });

      const perms = await getMemberPermissions(nonMember.id, testData.projects.projectAlpha.id);
      expect(perms).toEqual({
        role: null,
        canCreateTickets: false,
      });
    });
  });

  describe("isProjectMember", () => {
    it("returns true for project owner", async () => {
      const isMember = await isProjectMember(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(isMember).toBe(true);
    });

    it("returns true for worker member", async () => {
      const isMember = await isProjectMember(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(isMember).toBe(true);
    });

    it("returns true for client member", async () => {
      const isMember = await isProjectMember(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(isMember).toBe(true);
    });

    it("returns false for non-member", async () => {
      const nonMember = await prismaTest.user.create({
        data: {
          email: "nonmember3@test.com",
          password: "hashedpassword",
          name: "Non Member 3",
        },
      });

      const isMember = await isProjectMember(nonMember.id, testData.projects.projectAlpha.id);
      expect(isMember).toBe(false);
    });
  });

  describe("canUserCreateTickets", () => {
    it("allows OWNER to create tickets", async () => {
      const canCreate = await canUserCreateTickets(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(canCreate).toBe(true);
    });

    it("allows CLIENT to create tickets", async () => {
      const canCreate = await canUserCreateTickets(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(canCreate).toBe(true);
    });

    it("allows WORKER with canCreateTickets=true to create tickets", async () => {
      const canCreate = await canUserCreateTickets(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(canCreate).toBe(true);
    });

    it("denies WORKER with canCreateTickets=false to create tickets", async () => {
      const canCreate = await canUserCreateTickets(
        testData.users.charlie.id,
        testData.projects.projectAlpha.id
      );
      expect(canCreate).toBe(false);
    });

    it("denies non-member to create tickets", async () => {
      const nonMember = await prismaTest.user.create({
        data: {
          email: "nonmember4@test.com",
          password: "hashedpassword",
          name: "Non Member 4",
        },
      });

      const canCreate = await canUserCreateTickets(nonMember.id, testData.projects.projectAlpha.id);
      expect(canCreate).toBe(false);
    });
  });

  describe("canUserUpdateTicket", () => {
    it("allows OWNER to update any ticket", async () => {
      const canUpdate = await canUserUpdateTicket(
        testData.users.alice.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(true);
    });

    it("allows CLIENT to update their own ticket", async () => {
      const canUpdate = await canUserUpdateTicket(
        testData.users.diana.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(true);
    });

    it("denies CLIENT to update other users tickets", async () => {
      const canUpdate = await canUserUpdateTicket(
        testData.users.diana.id,
        testData.tickets.ticket1,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(false);
    });

    it("allows WORKER to update assigned ticket", async () => {
      const canUpdate = await canUserUpdateTicket(
        testData.users.bob.id,
        testData.tickets.ticket1,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(true);
    });

    it("allows WORKER to update ticket they created", async () => {
      const workerTicket = await prismaTest.ticket.create({
        data: {
          title: "Worker Created Ticket",
          projectId: testData.projects.projectAlpha.id,
          createdById: testData.users.bob.id,
          status: TicketStatus.BACKLOG,
          position: 99,
          approvals: {},
          lifecycleLog: [],
        },
      });

      const canUpdate = await canUserUpdateTicket(
        testData.users.bob.id,
        workerTicket,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(true);
    });

    it("denies WORKER to update unrelated ticket", async () => {
      const canUpdate = await canUserUpdateTicket(
        testData.users.bob.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(false);
    });
  });

  describe("canUserHardDeleteTicket", () => {
    it("allows OWNER to hard delete ticket", async () => {
      const canDelete = await canUserHardDeleteTicket(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(true);
    });

    it("denies WORKER to hard delete ticket", async () => {
      const canDelete = await canUserHardDeleteTicket(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });

    it("denies CLIENT to hard delete ticket", async () => {
      const canDelete = await canUserHardDeleteTicket(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });
  });

  describe("canUserSoftDeleteTicket", () => {
    it("allows OWNER to soft delete any ticket", async () => {
      const canDelete = await canUserSoftDeleteTicket(
        testData.users.alice.id,
        testData.tickets.ticket1,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(true);
    });

    it("allows WORKER to soft delete their own ticket", async () => {
      const workerTicket = await prismaTest.ticket.create({
        data: {
          title: "Worker Ticket",
          projectId: testData.projects.projectAlpha.id,
          createdById: testData.users.bob.id,
          status: TicketStatus.BACKLOG,
          position: 99,
          approvals: {},
          lifecycleLog: [],
        },
      });

      const canDelete = await canUserSoftDeleteTicket(
        testData.users.bob.id,
        workerTicket,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(true);
    });

    it("allows WORKER to soft delete assigned ticket", async () => {
      const canDelete = await canUserSoftDeleteTicket(
        testData.users.bob.id,
        testData.tickets.ticket1,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(true);
    });

    it("denies WORKER to soft delete unrelated ticket", async () => {
      const canDelete = await canUserSoftDeleteTicket(
        testData.users.bob.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });

    it("denies CLIENT to soft delete ticket", async () => {
      const canDelete = await canUserSoftDeleteTicket(
        testData.users.diana.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });
  });

  describe("canUserMoveTicket - WORKER transitions", () => {
    it("allows WORKER to move BACKLOG → IN_PROGRESS when assigned", async () => {
      const ticket = await prismaTest.ticket.create({
        data: {
          title: "Backlog Ticket",
          projectId: testData.projects.projectAlpha.id,
          createdById: testData.users.alice.id,
          assignedToId: testData.users.bob.id,
          status: TicketStatus.BACKLOG,
          position: 99,
          approvals: {},
          lifecycleLog: [],
        },
      });

      const canMove = await canUserMoveTicket(
        testData.users.bob.id,
        ticket,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(true);
    });

    it("denies WORKER to move BACKLOG → IN_PROGRESS when not assigned", async () => {
      const ticket = await prismaTest.ticket.create({
        data: {
          title: "Backlog Ticket",
          projectId: testData.projects.projectAlpha.id,
          createdById: testData.users.alice.id,
          status: TicketStatus.BACKLOG,
          position: 99,
          approvals: {},
          lifecycleLog: [],
        },
      });

      const canMove = await canUserMoveTicket(
        testData.users.bob.id,
        ticket,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(false);
    });

    it("allows WORKER to move IN_PROGRESS → REVIEW", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.charlie.id,
        testData.tickets.ticket2,
        testData.projects.projectAlpha.id,
        TicketStatus.IN_PROGRESS,
        TicketStatus.REVIEW
      );
      expect(canMove).toBe(true);
    });

    it("allows WORKER to move IN_PROGRESS → BLOCKED", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.charlie.id,
        testData.tickets.ticket2,
        testData.projects.projectAlpha.id,
        TicketStatus.IN_PROGRESS,
        TicketStatus.BLOCKED
      );
      expect(canMove).toBe(true);
    });

    it("allows WORKER to move IN_PROGRESS → WAITING", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.charlie.id,
        testData.tickets.ticket2,
        testData.projects.projectAlpha.id,
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING
      );
      expect(canMove).toBe(true);
    });

    it("allows WORKER to move BLOCKED → IN_PROGRESS", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.bob.id,
        testData.tickets.ticket6,
        testData.projects.projectAlpha.id,
        TicketStatus.BLOCKED,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(true);
    });

    it("allows WORKER to move WAITING → IN_PROGRESS", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.charlie.id,
        testData.tickets.ticket7,
        testData.projects.projectAlpha.id,
        TicketStatus.WAITING,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(true);
    });

    it("denies WORKER to move REVIEW → DONE", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.bob.id,
        testData.tickets.ticket3,
        testData.projects.projectAlpha.id,
        TicketStatus.REVIEW,
        TicketStatus.DONE
      );
      expect(canMove).toBe(false);
    });

    it("denies WORKER to move BACKLOG → DONE", async () => {
      const ticket = await prismaTest.ticket.create({
        data: {
          title: "Backlog Ticket",
          projectId: testData.projects.projectAlpha.id,
          createdById: testData.users.alice.id,
          assignedToId: testData.users.bob.id,
          status: TicketStatus.BACKLOG,
          position: 99,
          approvals: {},
          lifecycleLog: [],
        },
      });

      const canMove = await canUserMoveTicket(
        testData.users.bob.id,
        ticket,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.DONE
      );
      expect(canMove).toBe(false);
    });
  });

  describe("canUserMoveTicket - CLIENT transitions", () => {
    it("allows CLIENT to move REVIEW → DONE", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.diana.id,
        testData.tickets.ticket3,
        testData.projects.projectAlpha.id,
        TicketStatus.REVIEW,
        TicketStatus.DONE
      );
      expect(canMove).toBe(true);
    });

    it("denies CLIENT to move BACKLOG → IN_PROGRESS", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.diana.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(false);
    });

    it("denies CLIENT to move IN_PROGRESS → REVIEW", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.diana.id,
        testData.tickets.ticket2,
        testData.projects.projectAlpha.id,
        TicketStatus.IN_PROGRESS,
        TicketStatus.REVIEW
      );
      expect(canMove).toBe(false);
    });
  });

  describe("canUserMoveTicket - OWNER transitions", () => {
    it("allows OWNER to move BACKLOG → IN_PROGRESS", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.alice.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.IN_PROGRESS
      );
      expect(canMove).toBe(true);
    });

    it("allows OWNER to move REVIEW → DONE", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.alice.id,
        testData.tickets.ticket3,
        testData.projects.projectAlpha.id,
        TicketStatus.REVIEW,
        TicketStatus.DONE
      );
      expect(canMove).toBe(true);
    });

    it("allows OWNER to move BACKLOG → DONE (skip workflow)", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.alice.id,
        testData.tickets.ticket4,
        testData.projects.projectAlpha.id,
        TicketStatus.BACKLOG,
        TicketStatus.DONE
      );
      expect(canMove).toBe(true);
    });

    it("allows OWNER to move DONE → BACKLOG (reopen)", async () => {
      const canMove = await canUserMoveTicket(
        testData.users.alice.id,
        testData.tickets.ticket1,
        testData.projects.projectAlpha.id,
        TicketStatus.DONE,
        TicketStatus.BACKLOG
      );
      expect(canMove).toBe(true);
    });
  });

  describe("canUserUpdateProjectSettings", () => {
    it("allows OWNER to update project settings", async () => {
      const canUpdate = await canUserUpdateProjectSettings(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(true);
    });

    it("denies WORKER to update project settings", async () => {
      const canUpdate = await canUserUpdateProjectSettings(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(false);
    });

    it("denies CLIENT to update project settings", async () => {
      const canUpdate = await canUserUpdateProjectSettings(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(canUpdate).toBe(false);
    });
  });

  describe("canUserManageMembers", () => {
    it("allows OWNER to manage members", async () => {
      const canManage = await canUserManageMembers(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(canManage).toBe(true);
    });

    it("denies WORKER to manage members", async () => {
      const canManage = await canUserManageMembers(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(canManage).toBe(false);
    });

    it("denies CLIENT to manage members", async () => {
      const canManage = await canUserManageMembers(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(canManage).toBe(false);
    });
  });

  describe("canUserDeleteProject", () => {
    it("allows OWNER to delete project", async () => {
      const canDelete = await canUserDeleteProject(
        testData.users.alice.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(true);
    });

    it("denies WORKER to delete project", async () => {
      const canDelete = await canUserDeleteProject(
        testData.users.bob.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });

    it("denies CLIENT to delete project", async () => {
      const canDelete = await canUserDeleteProject(
        testData.users.diana.id,
        testData.projects.projectAlpha.id
      );
      expect(canDelete).toBe(false);
    });
  });
});
