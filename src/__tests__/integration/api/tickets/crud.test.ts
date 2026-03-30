/**
 * Integration Tests: Tickets API CRUD
 *
 * Tests:
 * - GET /api/projects/[projectId]/tickets - List tickets
 * - POST /api/projects/[projectId]/tickets - Create ticket
 * - GET /api/projects/[projectId]/tickets/[ticketId] - Get single ticket
 * - PATCH /api/projects/[projectId]/tickets/[ticketId] - Update ticket
 * - DELETE /api/projects/[projectId]/tickets/[ticketId] - Delete ticket
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
import { GET, POST } from "@/app/api/projects/[projectId]/tickets/route";
import {
  GET as GET_TICKET,
  PATCH as PATCH_TICKET,
  DELETE as DELETE_TICKET,
} from "@/app/api/projects/[projectId]/tickets/[ticketId]/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Tickets API CRUD", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/projects/[projectId]/tickets", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 for non-existent project", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest("http://localhost/api/projects/non-existent/tickets");
      const response = await GET(request, {
        params: Promise.resolve({ projectId: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("should return 403 if user has no access", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve); // Eve is only in Gamma
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return all tickets for project owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tickets).toBeDefined();
      expect(Array.isArray(data.tickets)).toBe(true);
      expect(data.tickets.length).toBeGreaterThan(0);
    });

    it("should return tickets for project member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tickets).toBeDefined();
    });

    it("should include ticket relations", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const ticket = data.tickets[0];
      expect(ticket.createdBy).toBeDefined();
      expect(ticket._count).toBeDefined();
    });
  });

  describe("POST /api/projects/[projectId]/tickets", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({ title: "New Ticket" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 if user has no access", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({ title: "New Ticket" }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(403);
    });

    it("should create ticket as owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "New Feature Ticket",
            description: "This is a test ticket",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket).toBeDefined();
      expect(data.ticket.title).toBe("New Feature Ticket");
      expect(data.ticket.status).toBe("BACKLOG");
      expect(data.ticket.createdBy.id).toBe(users.alice.id);
    });

    it("should create ticket as worker with canCreateTickets permission", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Bob has canCreateTickets=true
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Worker Ticket",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket.createdBy.id).toBe(users.bob.id);
    });

    it("should reject ticket creation for worker without canCreateTickets", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.charlie); // Charlie has canCreateTickets=false
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Charlie Ticket",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Workers need permission");
    });

    it("should create ticket as client (always goes to BACKLOG)", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana); // Diana is CLIENT
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Client Request",
            description: "A feature request from the client",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket.status).toBe("BACKLOG");
      expect(data.ticket.isClientRequest).toBe(true);
    });

    it("should reject client trying to create ticket with non-BACKLOG status", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Client Request",
            status: "IN_PROGRESS", // Not allowed for clients
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Clients can only create tickets in backlog");
    });

    it("should create ticket with estimation", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Estimated Ticket",
            estimatedHours: 8,
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket.estimatedHours).toBe(8);
    });
  });

  describe("GET /api/projects/[projectId]/tickets/[ticketId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, tickets } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`
      );
      const response = await GET_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent`
      );
      const response = await GET_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Ticket not found");
    });

    it("should return 403 if user has no access", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`
      );
      const response = await GET_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return ticket with full details", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`
      );
      const response = await GET_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket).toBeDefined();
      expect(data.ticket.id).toBe(tickets.ticket1.id);
      expect(data.ticket.project).toBeDefined();
      expect(data.ticket.createdBy).toBeDefined();
    });
  });

  describe("PATCH /api/projects/[projectId]/tickets/[ticketId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, tickets } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "Updated Title" }),
        }
      );
      const response = await PATCH_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should update ticket title as owner", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "Updated Ticket Title" }),
        }
      );
      const response = await PATCH_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.title).toBe("Updated Ticket Title");
    });

    it("should update ticket description", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ description: "Updated description" }),
        }
      );
      const response = await PATCH_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.description).toBe("Updated description");
    });

    it("should update estimatedHours as owner", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ estimatedHours: 16 }),
        }
      );
      const response = await PATCH_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.estimatedHours).toBe(16);
    });

    it("should update loggedHours", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ loggedHours: 4.5 }),
        }
      );
      const response = await PATCH_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.loggedHours).toBe(4.5);
    });
  });

  describe("DELETE /api/projects/[projectId]/tickets/[ticketId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, tickets } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should hard delete ticket as owner", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted).toBe("hard");

      // Verify ticket is deleted
      const deletedTicket = await prisma.ticket.findUnique({
        where: { id: tickets.ticket1.id },
      });
      expect(deletedTicket).toBeNull();
    });

    it("should soft delete (archive) ticket as worker", async () => {
      const { users, projects, tickets } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // First assign the ticket to Bob so he can delete it
      await prisma.ticket.update({
        where: { id: tickets.ticket1.id },
        data: { assignedToId: users.bob.id },
      });

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${tickets.ticket1.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: tickets.ticket1.id,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted).toBe("soft");

      // Verify ticket is archived
      const archivedTicket = await prisma.ticket.findUnique({
        where: { id: tickets.ticket1.id },
      });
      expect(archivedTicket).toBeDefined();
      expect(archivedTicket!.status).toBe("ARCHIVED");
    });

    it("should return 404 for non-existent ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent`,
        { method: "DELETE" }
      );
      const response = await DELETE_TICKET(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Ticket not found");
    });
  });
});
