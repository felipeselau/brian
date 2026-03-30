/**
 * Integration Tests: Projects API CRUD
 *
 * Tests:
 * - GET /api/projects - List projects
 * - POST /api/projects - Create project
 * - GET /api/projects/[projectId] - Get single project
 * - PATCH /api/projects/[projectId] - Update project
 * - DELETE /api/projects/[projectId] - Delete project
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDatabase, seedTestData } from "@/__tests__/setup/test-db";
import {
  createMockSession,
  createMockUserFromSeeded,
  type MockSession,
} from "@/__tests__/setup/auth-mock";

// Mock the auth module
vi.mock("@/lib/auth", () => {
  const mockAuth = vi.fn();
  return {
    auth: mockAuth,
    __mockAuth: mockAuth, // expose for tests
  };
});

import { auth } from "@/lib/auth";
import { GET, POST } from "@/app/api/projects/route";
import {
  GET as GET_PROJECT,
  PATCH as PATCH_PROJECT,
  DELETE as DELETE_PROJECT,
} from "@/app/api/projects/[projectId]/route";

// Get reference to the mock
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Projects API CRUD", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/projects", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new Request("http://localhost/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return projects owned by user", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toBeDefined();
      expect(Array.isArray(data.projects)).toBe(true);

      // Alice owns Alpha and Beta
      const projectTitles = data.projects.map((p: any) => p.title);
      expect(projectTitles).toContain("Project Alpha");
      expect(projectTitles).toContain("Project Beta");
    });

    it("should return projects where user is member", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Bob is member of Alpha and Gamma
      const projectTitles = data.projects.map((p: any) => p.title);
      expect(projectTitles).toContain("Project Alpha");
      expect(projectTitles).toContain("Project Gamma");
      expect(projectTitles).not.toContain("Project Beta");
    });

    it("should filter by status when provided", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects?status=ARCHIVED");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Only Beta is archived
      expect(data.projects.length).toBe(1);
      expect(data.projects[0].title).toBe("Project Beta");
      expect(data.projects[0].status).toBe("ARCHIVED");
    });

    it("should include project counts and relations", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const alphaProject = data.projects.find((p: any) => p.title === "Project Alpha");
      expect(alphaProject).toBeDefined();
      expect(alphaProject.owner).toBeDefined();
      expect(alphaProject.owner.email).toBe("alice@brian.dev");
      expect(alphaProject.members).toBeDefined();
      expect(alphaProject._count).toBeDefined();
      expect(alphaProject._count.tickets).toBeGreaterThan(0);
    });
  });

  describe("POST /api/projects", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "New Project",
          startDate: "2026-04-01",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not OWNER", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // WORKER
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "New Project",
          startDate: "2026-04-01",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only owners can create projects");
    });

    it("should create project with minimal data", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "New Project",
          startDate: "2026-04-01",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project).toBeDefined();
      expect(data.project.title).toBe("New Project");
      expect(data.project.ownerId).toBe(users.alice.id);
      expect(data.project.status).toBe("ACTIVE");
      // Should have default columns and settings
      expect(data.project.columns).toBeDefined();
      expect(data.project.settings).toBeDefined();
    });

    it("should create project with full data", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const customColumns = [
        { id: "todo", title: "To Do", order: 0 },
        { id: "doing", title: "Doing", order: 1 },
        { id: "done", title: "Done", order: 2 },
      ];

      const customSettings = {
        requireEstimateBeforeStart: true,
        estimateRequired: true,
      };

      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "Full Project",
          description: "A fully configured project",
          startDate: "2026-04-01",
          endDate: "2026-12-31",
          columns: customColumns,
          settings: customSettings,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.title).toBe("Full Project");
      expect(data.project.description).toBe("A fully configured project");
      expect(data.project.columns).toEqual(customColumns);
      expect(data.project.settings).toEqual(customSettings);
    });

    it("should reject invalid data", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          // Missing required title
          startDate: "2026-04-01",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/projects/[projectId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`);
      const response = await GET_PROJECT(request, {
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

      const request = new NextRequest("http://localhost/api/projects/non-existent-id");
      const response = await GET_PROJECT(request, {
        params: Promise.resolve({ projectId: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("should return 403 if user has no access", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve); // Eve is only in Gamma
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`);
      const response = await GET_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return project for owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`);
      const response = await GET_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(projects.projectAlpha.id);
      expect(data.title).toBe("Project Alpha");
      expect(data.owner).toBeDefined();
      expect(data.members).toBeDefined();
      expect(data.tickets).toBeDefined();
    });

    it("should return project for member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`);
      const response = await GET_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(projects.projectAlpha.id);
    });
  });

  describe("PATCH /api/projects/[projectId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const response = await PATCH_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Member, not owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const response = await PATCH_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only the project owner");
    });

    it("should update project title", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Alpha" }),
      });
      const response = await PATCH_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Updated Alpha");
    });

    it("should update project status to ARCHIVED", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      const response = await PATCH_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ARCHIVED");
    });

    it("should update project settings", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const newSettings = {
        requireEstimateBeforeStart: true,
        estimateRequired: true,
      };

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "PATCH",
        body: JSON.stringify({ settings: newSettings }),
      });
      const response = await PATCH_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings).toEqual(newSettings);
    });
  });

  describe("DELETE /api/projects/[projectId]", () => {
    it("should return 401 if not authenticated", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "DELETE",
      });
      const response = await DELETE_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not owner", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "DELETE",
      });
      const response = await DELETE_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only the project owner");
    });

    it("should delete project and cascade to tickets", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      // Get ticket count before deletion
      const prisma = (await import("@/lib/prisma")).default;
      const ticketsBefore = await prisma.ticket.count({
        where: { projectId: projects.projectAlpha.id },
      });
      expect(ticketsBefore).toBeGreaterThan(0);

      const request = new NextRequest(`http://localhost/api/projects/${projects.projectAlpha.id}`, {
        method: "DELETE",
      });
      const response = await DELETE_PROJECT(request, {
        params: Promise.resolve({ projectId: projects.projectAlpha.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify project is deleted
      const deletedProject = await prisma.project.findUnique({
        where: { id: projects.projectAlpha.id },
      });
      expect(deletedProject).toBeNull();

      // Verify tickets are cascaded (deleted)
      const ticketsAfter = await prisma.ticket.count({
        where: { projectId: projects.projectAlpha.id },
      });
      expect(ticketsAfter).toBe(0);
    });

    it("should return 404 for non-existent project", async () => {
      const { users } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const request = new NextRequest("http://localhost/api/projects/non-existent", {
        method: "DELETE",
      });
      const response = await DELETE_PROJECT(request, {
        params: Promise.resolve({ projectId: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });
  });
});
