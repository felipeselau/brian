/**
 * Integration Tests: Project Members API
 *
 * Tests:
 * - GET /api/projects/[projectId]/members - List members
 * - POST /api/projects/[projectId]/members - Add member
 * - PATCH /api/projects/[projectId]/members - Update member permissions
 * - DELETE /api/projects/[projectId]/members - Remove member
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
import { GET, POST, PATCH, DELETE } from "@/app/api/projects/[projectId]/members/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Project Members API", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/projects/[projectId]/members", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`
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

      const request = new NextRequest("http://localhost/api/projects/non-existent/members");
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
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return members list for owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toBeDefined();
      expect(Array.isArray(data.members)).toBe(true);

      // Should include owner and all members
      const memberEmails = data.members.map((m: any) => m.email);
      expect(memberEmails).toContain("alice@brian.dev"); // Owner
      expect(memberEmails).toContain("bob@brian.dev"); // Worker
      expect(memberEmails).toContain("charlie@brian.dev"); // Worker
      expect(memberEmails).toContain("diana@brian.dev"); // Client
    });

    it("should return members list for member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toBeDefined();
    });

    it("should include role for each member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`
      );
      const response = await GET(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);

      const aliceMember = data.members.find((m: any) => m.email === "alice@brian.dev");
      const bobMember = data.members.find((m: any) => m.email === "bob@brian.dev");
      const dianaMember = data.members.find((m: any) => m.email === "diana@brian.dev");

      expect(aliceMember.role).toBe("OWNER");
      expect(bobMember.role).toBe("WORKER");
      expect(dianaMember.role).toBe("CLIENT");
    });
  });

  describe("POST /api/projects/[projectId]/members", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, users } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: users.eve.id,
            role: "WORKER",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not owner", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker, not owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: users.eve.id,
            role: "WORKER",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only the project owner");
    });

    it("should add new member to project", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Eve is not a member of Alpha
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: users.eve.id,
            role: "CLIENT",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.member).toBeDefined();
      expect(data.member.user.id).toBe(users.eve.id);
      expect(data.member.role).toBe("CLIENT");

      // Verify in DB
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectAlpha.id,
            userId: users.eve.id,
          },
        },
      });
      expect(member).toBeDefined();
      expect(member!.role).toBe("CLIENT");
    });

    it("should reject if user is already a member", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Bob is already a member
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: users.bob.id,
            role: "WORKER",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already a member");
    });

    it("should return 404 if user does not exist", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: "non-existent-user-id",
            role: "WORKER",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should reject invalid role", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: users.eve.id,
            role: "INVALID_ROLE",
          }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/projects/[projectId]/members", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, users } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: users.bob.id,
            canCreateTickets: true,
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not owner", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: users.charlie.id,
            canCreateTickets: true,
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it("should update member canCreateTickets permission", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Charlie initially has canCreateTickets = false
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: users.charlie.id,
            canCreateTickets: true,
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.member.canCreateTickets).toBe(true);

      // Verify in DB
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectAlpha.id,
            userId: users.charlie.id,
          },
        },
      });
      expect(member!.canCreateTickets).toBe(true);
    });

    it("should update member role", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: users.bob.id,
            role: "CLIENT",
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.member.role).toBe("CLIENT");
    });

    it("should return 404 if user is not a member", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: users.eve.id, // Eve is not in Alpha
            canCreateTickets: true,
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not a member");
    });
  });

  describe("DELETE /api/projects/[projectId]/members", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects, users } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "DELETE",
          body: JSON.stringify({
            userId: users.bob.id,
          }),
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not owner", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "DELETE",
          body: JSON.stringify({
            userId: users.charlie.id,
          }),
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it("should remove member from project", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Verify Bob is a member before
      const memberBefore = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectAlpha.id,
            userId: users.bob.id,
          },
        },
      });
      expect(memberBefore).toBeDefined();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "DELETE",
          body: JSON.stringify({
            userId: users.bob.id,
          }),
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify Bob is no longer a member
      const memberAfter = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectAlpha.id,
            userId: users.bob.id,
          },
        },
      });
      expect(memberAfter).toBeNull();
    });

    it("should return 404 if user is not a member", async () => {
      const { projects, users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/members`,
        {
          method: "DELETE",
          body: JSON.stringify({
            userId: users.eve.id, // Eve is not in Alpha
          }),
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not a member");
    });
  });
});
