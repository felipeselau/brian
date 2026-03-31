/**
 * Integration Tests: Ticket Checklists
 *
 * Tests the checklist CRUD operations:
 * - Create/List/Delete checklists
 * - Add/Update/Delete checklist items
 * - Toggle item completion
 * - Position ordering
 *
 * Permission rules tested:
 * - Only project members can access checklists
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
import {
  GET as GET_CHECKLISTS,
  POST as POST_CHECKLIST,
} from "@/app/api/projects/[projectId]/tickets/[ticketId]/checklists/route";
import { DELETE as DELETE_CHECKLIST } from "@/app/api/projects/[projectId]/tickets/[ticketId]/checklists/[checklistId]/route";
import {
  POST as POST_ITEM,
  PATCH as PATCH_ITEM,
  DELETE as DELETE_ITEM,
} from "@/app/api/projects/[projectId]/tickets/[ticketId]/checklists/[checklistId]/items/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Ticket Checklists", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a test ticket
  async function createTestTicket() {
    const { users, projects } = seededData;
    return prisma.ticket.create({
      data: {
        title: "Test Ticket for Checklists",
        status: "IN_PROGRESS",
        projectId: projects.projectAlpha.id,
        createdById: users.alice.id,
        lifecycleLog: [],
        approvals: {},
      },
    });
  }

  // Helper to create a test checklist
  async function createTestChecklist(ticketId: string) {
    return prisma.checklist.create({
      data: {
        title: "Test Checklist",
        ticketId,
        position: 0,
      },
    });
  }

  // Helper to create a checklist item
  async function createChecklistItem(checklistId: string, content: string, position: number) {
    return prisma.checklistItem.create({
      data: {
        content,
        checklistId,
        position,
      },
    });
  }

  describe("GET /checklists - List Checklists", () => {
    it("should list checklists for a ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      await createChecklistItem(checklist.id, "Item 1", 0);
      await createChecklistItem(checklist.id, "Item 2", 1);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        { method: "GET" }
      );

      const response = await GET_CHECKLISTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklists).toHaveLength(1);
      expect(data.checklists[0].title).toBe("Test Checklist");
      expect(data.checklists[0].items).toHaveLength(2);
    });

    it("should return items in position order", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      await createChecklistItem(checklist.id, "Third", 2);
      await createChecklistItem(checklist.id, "First", 0);
      await createChecklistItem(checklist.id, "Second", 1);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        { method: "GET" }
      );

      const response = await GET_CHECKLISTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(data.checklists[0].items[0].content).toBe("First");
      expect(data.checklists[0].items[1].content).toBe("Second");
      expect(data.checklists[0].items[2].content).toBe("Third");
    });

    it("should reject non-member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve); // Not a member of Alpha
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        { method: "GET" }
      );

      const response = await GET_CHECKLISTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(403);
    });

    it("should return 404 for non-existent ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent-id/checklists`,
        { method: "GET" }
      );

      const response = await GET_CHECKLISTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /checklists - Create Checklist", () => {
    it("should create checklist with title only", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        {
          method: "POST",
          body: JSON.stringify({ title: "New Checklist" }),
        }
      );

      const response = await POST_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.checklist.title).toBe("New Checklist");
      expect(data.checklist.items).toHaveLength(0);
    });

    it("should create checklist with initial items", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        {
          method: "POST",
          body: JSON.stringify({
            title: "Checklist with Items",
            items: [{ content: "First item" }, { content: "Second item" }],
          }),
        }
      );

      const response = await POST_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.checklist.title).toBe("Checklist with Items");
      expect(data.checklist.items).toHaveLength(2);
      expect(data.checklist.items[0].content).toBe("First item");
    });

    it("should auto-increment position", async () => {
      const { users, projects } = seededData;

      const ticket = await createTestTicket();

      // Create first checklist
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.alice)));
      await POST_CHECKLIST(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
          {
            method: "POST",
            body: JSON.stringify({ title: "First" }),
          }
        ),
        {
          params: Promise.resolve({
            projectId: projects.projectAlpha.id,
            ticketId: ticket.id,
          }),
        }
      );

      // Create second checklist
      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.alice)));
      const response = await POST_CHECKLIST(
        new NextRequest(
          `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
          {
            method: "POST",
            body: JSON.stringify({ title: "Second" }),
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

      expect(data.checklist.position).toBe(1);
    });

    it("should reject empty title", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        {
          method: "POST",
          body: JSON.stringify({ title: "" }),
        }
      );

      const response = await POST_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject non-member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        {
          method: "POST",
          body: JSON.stringify({ title: "New Checklist" }),
        }
      );

      const response = await POST_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /checklists/[checklistId] - Delete Checklist", () => {
    it("should delete checklist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.checklist.findUnique({
        where: { id: checklist.id },
      });
      expect(deleted).toBeNull();
    });

    it("should cascade delete items", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      const item = await createChecklistItem(checklist.id, "Item", 0);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}`,
        { method: "DELETE" }
      );

      await DELETE_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      // Verify item deleted
      const deletedItem = await prisma.checklistItem.findUnique({
        where: { id: item.id },
      });
      expect(deletedItem).toBeNull();
    });

    it("should return 404 for non-existent checklist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/non-existent-id`,
        { method: "DELETE" }
      );

      const response = await DELETE_CHECKLIST(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /checklists/[checklistId]/items - Add Item", () => {
    it("should add item to checklist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          body: JSON.stringify({ content: "New item" }),
        }
      );

      const response = await POST_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.item.content).toBe("New item");
      expect(data.item.completed).toBe(false);
    });

    it("should auto-increment item position", async () => {
      const { users, projects } = seededData;

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      await createChecklistItem(checklist.id, "Existing", 0);

      mockAuth.mockResolvedValueOnce(createMockSession(createMockUserFromSeeded(users.alice)));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          body: JSON.stringify({ content: "New item" }),
        }
      );

      const response = await POST_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(data.item.position).toBe(1);
    });

    it("should allow explicit position", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          body: JSON.stringify({ content: "At position 5", position: 5 }),
        }
      );

      const response = await POST_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(data.item.position).toBe(5);
    });
  });

  describe("PATCH /checklists/[checklistId]/items - Update Item", () => {
    it("should toggle item completion", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      const item = await createChecklistItem(checklist.id, "To complete", 0);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({ itemId: item.id, completed: true }),
        }
      );

      const response = await PATCH_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.item.completed).toBe(true);
    });

    it("should update item content", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      const item = await createChecklistItem(checklist.id, "Old content", 0);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({ itemId: item.id, content: "New content" }),
        }
      );

      const response = await PATCH_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.item.content).toBe("New content");
    });

    it("should update item position", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      const item = await createChecklistItem(checklist.id, "Move me", 0);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({ itemId: item.id, position: 10 }),
        }
      );

      const response = await PATCH_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.item.position).toBe(10);
    });

    it("should return 404 for non-existent item", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({ itemId: "non-existent-id", completed: true }),
        }
      );

      const response = await PATCH_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /checklists/[checklistId]/items - Delete Item", () => {
    it("should delete checklist item", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);
      const item = await createChecklistItem(checklist.id, "Delete me", 0);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items?itemId=${item.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.checklistItem.findUnique({
        where: { id: item.id },
      });
      expect(deleted).toBeNull();
    });

    it("should require itemId parameter", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist = await createTestChecklist(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist.id}/items`,
        { method: "DELETE" }
      );

      const response = await DELETE_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Item ID is required");
    });

    it("should return 404 for item in wrong checklist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const checklist1 = await createTestChecklist(ticket.id);
      const checklist2 = await prisma.checklist.create({
        data: { title: "Second", ticketId: ticket.id, position: 1 },
      });
      const item = await createChecklistItem(checklist1.id, "Item in CL1", 0);

      // Try to delete item from checklist2 (wrong checklist)
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists/${checklist2.id}/items?itemId=${item.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ITEM(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          checklistId: checklist2.id,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/checklists`,
        { method: "GET" }
      );

      const response = await GET_CHECKLISTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
