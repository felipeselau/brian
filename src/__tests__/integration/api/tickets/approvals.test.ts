/**
 * Integration Tests: Ticket Approvals
 *
 * Tests the approval flow for tickets moving from REVIEW to DONE:
 * - Owner approval flow
 * - Client approval flow (requires owner approval first)
 * - Rejection flow (resets to IN_PROGRESS)
 * - Permission checks
 *
 * Critical business rules tested:
 * - Only OWNER can approve as owner
 * - Only CLIENT can approve as client
 * - Client cannot approve before owner
 * - Rejection resets approvals and status
 * - Full approval triggers automatic DONE status
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDatabase, seedTestData } from "@/__tests__/setup/test-db";
import { createMockSession, createMockUserFromSeeded } from "@/__tests__/setup/auth-mock";
import prisma from "@/lib/prisma";

// Mock the auth module
vi.mock("@/lib/auth", () => {
  const mockAuth = vi.fn();
  return {
    auth: mockAuth,
    __mockAuth: mockAuth,
  };
});

import { auth } from "@/lib/auth";
import { POST as POST_APPROVE } from "@/app/api/projects/[projectId]/tickets/[ticketId]/approve/route";
import { POST as POST_REJECT } from "@/app/api/projects/[projectId]/tickets/[ticketId]/reject/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Ticket Approvals", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a review ticket
  async function createReviewTicket(overrides = {}) {
    const { users, projects } = seededData;
    return prisma.ticket.create({
      data: {
        title: "Test Review Ticket",
        status: "REVIEW",
        projectId: projects.projectAlpha.id,
        createdById: users.alice.id,
        assignedToId: users.bob.id,
        lifecycleLog: [],
        approvals: {},
        ...overrides,
      },
    });
  }

  describe("Owner Approval", () => {
    it("should allow owner to approve ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice); // Owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.approvals).toEqual({ owner: true });
      expect(data.ticket.status).toBe("REVIEW"); // Still in review, waiting for client
    });

    it("should reject non-owner trying to approve as owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker, not owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only project owner");
    });

    it("should add lifecycle log entry when owner approves", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      const lifecycleLog = updatedTicket!.lifecycleLog as any[];
      expect(lifecycleLog.length).toBe(1);
      expect(lifecycleLog[0].action).toBe("approved_owner");
      expect(lifecycleLog[0].by).toBe(users.alice.id);
    });
  });

  describe("Client Approval", () => {
    it("should allow client to approve after owner approval", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana); // Client
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Ticket with owner already approved
      const ticket = await createReviewTicket({
        approvals: { owner: true },
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "client" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.approvals).toEqual({ owner: true, client: true });
      expect(data.ticket.status).toBe("DONE"); // Both approved → DONE
    });

    it("should reject client approval before owner approval", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana); // Client
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket({
        approvals: {}, // No owner approval yet
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "client" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Owner must approve before client");
    });

    it("should reject non-client trying to approve as client", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker, not client
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket({
        approvals: { owner: true },
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "client" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only clients can approve");
    });
  });

  describe("Full Approval Flow", () => {
    it("should move ticket to DONE when both owner and client approve", async () => {
      const { users, projects } = seededData;

      const ticket = await createReviewTicket();

      // Step 1: Owner approves
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.alice)));
      await POST_APPROVE(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ type: "owner" }),
          }
        ),
        {
          params: Promise.resolve({
            projectId: projects.projectAlpha.id,
            ticketId: ticket.id,
          }),
        }
      );

      // Verify still in REVIEW
      let updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });
      expect(updatedTicket!.status).toBe("REVIEW");

      // Step 2: Client approves
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.diana)));
      const response = await POST_APPROVE(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ type: "client" }),
          }
        ),
        {
          params: Promise.resolve({
            projectId: projects.projectAlpha.id,
            ticketId: ticket.id,
          }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.status).toBe("DONE");
      expect(data.ticket.approvals).toEqual({ owner: true, client: true });
    });

    it("should record both approvals in lifecycle log", async () => {
      const { users, projects } = seededData;

      const ticket = await createReviewTicket();

      // Owner approves
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.alice)));
      await POST_APPROVE(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ type: "owner" }),
          }
        ),
        {
          params: Promise.resolve({
            projectId: projects.projectAlpha.id,
            ticketId: ticket.id,
          }),
        }
      );

      // Client approves
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.diana)));
      await POST_APPROVE(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ type: "client" }),
          }
        ),
        {
          params: Promise.resolve({
            projectId: projects.projectAlpha.id,
            ticketId: ticket.id,
          }),
        }
      );

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });
      const lifecycleLog = updatedTicket!.lifecycleLog as any[];

      expect(lifecycleLog.length).toBe(2);
      expect(lifecycleLog[0].action).toBe("approved_owner");
      expect(lifecycleLog[0].by).toBe(users.alice.id);
      expect(lifecycleLog[1].action).toBe("approved_client");
      expect(lifecycleLog[1].by).toBe(users.diana.id);
    });
  });

  describe("Rejection Flow", () => {
    it("should allow owner to reject ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.status).toBe("IN_PROGRESS");
      expect(data.ticket.approvals).toEqual({}); // Reset
    });

    it("should allow client to reject ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket({
        approvals: { owner: true }, // Owner already approved
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "client" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.status).toBe("IN_PROGRESS");
      expect(data.ticket.approvals).toEqual({}); // Resets all approvals
    });

    it("should reject non-owner trying to reject as owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only project owner can reject");
    });

    it("should reject non-client trying to reject as client", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "client" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only clients can reject");
    });

    it("should add lifecycle log entry when rejected", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      const lifecycleLog = updatedTicket!.lifecycleLog as any[];
      expect(lifecycleLog.length).toBe(1);
      expect(lifecycleLog[0].action).toBe("rejected_owner");
      expect(lifecycleLog[0].from).toBe("REVIEW");
      expect(lifecycleLog[0].to).toBe("IN_PROGRESS");
    });
  });

  describe("Status Validation", () => {
    it("should reject approval for non-REVIEW ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Create a BACKLOG ticket
      const ticket = await prisma.ticket.create({
        data: {
          title: "Backlog Ticket",
          status: "BACKLOG",
          projectId: projects.projectAlpha.id,
          createdById: users.alice.id,
          lifecycleLog: [],
          approvals: {},
        },
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("must be in REVIEW status");
    });

    it("should reject rejection for non-REVIEW ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Create an IN_PROGRESS ticket
      const ticket = await prisma.ticket.create({
        data: {
          title: "In Progress Ticket",
          status: "IN_PROGRESS",
          projectId: projects.projectAlpha.id,
          createdById: users.alice.id,
          lifecycleLog: [],
          approvals: {},
        },
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("must be in REVIEW status");
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated approve request", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated reject request", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_REJECT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Ticket Not Found", () => {
    it("should return 404 for non-existent ticket on approve", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent-id/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 for ticket in wrong project", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Ticket in projectAlpha
      const ticket = await createReviewTicket();

      // Try to access from projectGamma (owned by Frank)
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectGamma.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "owner" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectGamma.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Invalid Request Body", () => {
    it("should reject invalid approval type", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ type: "invalid-type" }),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject missing type field", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createReviewTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const response = await POST_APPROVE(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
