/**
 * Integration Tests: Ticket Comments
 *
 * Tests the comment CRUD operations:
 * - List comments for a ticket
 * - Create new comments
 * - Edit existing comments
 * - Delete comments
 *
 * Permission rules tested:
 * - Only project members can view/create comments
 * - Only comment author or project owner can edit/delete
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
  GET as GET_COMMENTS,
  POST as POST_COMMENT,
  DELETE as DELETE_COMMENT,
} from "@/app/api/projects/[projectId]/tickets/[ticketId]/comments/route";
import { PATCH as PATCH_COMMENT } from "@/app/api/projects/[projectId]/tickets/[ticketId]/comments/[commentId]/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Ticket Comments", () => {
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
        title: "Test Ticket for Comments",
        status: "IN_PROGRESS",
        projectId: projects.projectAlpha.id,
        createdById: users.alice.id,
        lifecycleLog: [],
        approvals: {},
      },
    });
  }

  // Helper to create a test comment
  async function createTestComment(ticketId: string, userId: string) {
    return prisma.comment.create({
      data: {
        content: "Test comment content",
        ticketId,
        userId,
      },
    });
  }

  describe("GET /comments - List Comments", () => {
    it("should list comments for a ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      await createTestComment(ticket.id, users.alice.id);
      await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(2);
      expect(data.comments[0]).toHaveProperty("content");
      expect(data.comments[0]).toHaveProperty("user");
    });

    it("should include user details with each comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments[0].user).toHaveProperty("id", users.bob.id);
      expect(data.comments[0].user).toHaveProperty("name");
      expect(data.comments[0].user).toHaveProperty("email");
    });

    it("should reject non-member trying to list comments", async () => {
      const { users, projects } = seededData;
      // Eve is only a member of Gamma, not Alpha
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
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
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent-id/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return empty array when no comments exist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(0);
    });
  });

  describe("POST /comments - Create Comment", () => {
    it("should allow project member to create comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker member
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "This is a new comment" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment.content).toBe("This is a new comment");
      expect(data.comment.user.id).toBe(users.bob.id);
    });

    it("should allow project owner to create comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice); // Owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "Owner comment" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment.content).toBe("Owner comment");
    });

    it("should allow client member to create comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.diana); // Client
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "Client feedback" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment.content).toBe("Client feedback");
    });

    it("should reject non-member trying to create comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve); // Not a member of Alpha
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "Unauthorized comment" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(403);
    });

    it("should reject empty comment content", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent-id/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "Comment" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /comments/[commentId] - Edit Comment", () => {
    it("should allow comment author to edit their comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments/${comment.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Updated comment content" }),
        }
      );

      const response = await PATCH_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          commentId: comment.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment.content).toBe("Updated comment content");
    });

    it("should allow project owner to edit any comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice); // Owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      // Comment by Bob, not Alice
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments/${comment.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Owner edited this" }),
        }
      );

      const response = await PATCH_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          commentId: comment.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment.content).toBe("Owner edited this");
    });

    it("should reject non-author non-owner trying to edit comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.charlie); // Worker, not owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      // Comment by Bob
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments/${comment.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Trying to edit" }),
        }
      );

      const response = await PATCH_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          commentId: comment.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("only edit your own");
    });

    it("should return 404 for non-existent comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments/non-existent-id`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Editing" }),
        }
      );

      const response = await PATCH_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          commentId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /comments - Delete Comment", () => {
    it("should allow comment author to delete their comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments?commentId=${comment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deletion
      const deletedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(deletedComment).toBeNull();
    });

    it("should allow project owner to delete any comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice); // Owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      // Comment by Bob
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments?commentId=${comment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should reject non-author non-owner trying to delete comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.charlie); // Worker
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.bob.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments?commentId=${comment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("only delete your own");
    });

    it("should require commentId parameter", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Comment ID is required");
    });

    it("should return 404 for non-existent comment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments?commentId=non-existent-id`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 for comment in wrong project", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.alice.id);

      // Try to delete via wrong project
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectGamma.id}/tickets/${ticket.id}/comments?commentId=${comment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectGamma.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated GET request", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        { method: "GET" }
      );

      const response = await GET_COMMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated POST request", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: "Comment" }),
        }
      );

      const response = await POST_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated PATCH request", async () => {
      const { users, projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.alice.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments/${comment.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Updated" }),
        }
      );

      const response = await PATCH_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
          commentId: comment.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated DELETE request", async () => {
      const { users, projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();
      const comment = await createTestComment(ticket.id, users.alice.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/comments?commentId=${comment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_COMMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
