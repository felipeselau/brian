/**
 * Integration Tests: Ticket Attachments
 *
 * Tests attachment CRUD operations:
 * - List attachments
 * - Create attachment (metadata only)
 * - Upload files (mocked R2)
 * - Delete attachments
 *
 * Permission rules tested:
 * - Only project members can view/create attachments
 * - Only project owner can delete attachments
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

// Mock R2 upload
vi.mock("@/lib/r2", () => ({
  uploadToR2: vi.fn(async (buffer: Buffer, key: string, type: string) => {
    return `https://mock-r2.cloudflare.com/${key}`;
  }),
  deleteFromR2: vi.fn(async (key: string) => true),
}));

import { auth } from "@/lib/auth";
import {
  GET as GET_ATTACHMENTS,
  POST as POST_ATTACHMENT,
  DELETE as DELETE_ATTACHMENT,
} from "@/app/api/projects/[projectId]/tickets/[ticketId]/attachments/route";
import { POST as UPLOAD_FILES } from "@/app/api/projects/[projectId]/tickets/[ticketId]/attachments/upload/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Ticket Attachments", () => {
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
        title: "Test Ticket for Attachments",
        status: "IN_PROGRESS",
        projectId: projects.projectAlpha.id,
        createdById: users.alice.id,
        lifecycleLog: [],
        approvals: {},
      },
    });
  }

  // Helper to create a test attachment
  async function createTestAttachment(ticketId: string) {
    return prisma.attachment.create({
      data: {
        name: "test-file.pdf",
        url: "https://mock-r2.cloudflare.com/test-file.pdf",
        size: 1024,
        type: "application/pdf",
        ticketId,
      },
    });
  }

  describe("GET /attachments - List Attachments", () => {
    it("should list attachments for a ticket", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      await createTestAttachment(ticket.id);
      await createTestAttachment(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.attachments).toHaveLength(2);
      expect(data.attachments[0]).toHaveProperty("name");
      expect(data.attachments[0]).toHaveProperty("url");
    });

    it("should allow project member to view attachments", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker member
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      await createTestAttachment(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(200);
    });

    it("should reject non-member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve); // Not a member of Alpha
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
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
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/non-existent-id/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: "non-existent-id",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return empty array when no attachments exist", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.attachments).toHaveLength(0);
    });
  });

  describe("POST /attachments - Create Attachment (Metadata)", () => {
    it("should create attachment with metadata", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "document.pdf",
            url: "https://example.com/document.pdf",
            size: 2048,
            type: "application/pdf",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.attachment.name).toBe("document.pdf");
      expect(data.attachment.url).toBe("https://example.com/document.pdf");
      expect(data.attachment.size).toBe(2048);
    });

    it("should allow project member to create attachment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "file.txt",
            url: "https://example.com/file.txt",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(201);
    });

    it("should reject non-member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "file.txt",
            url: "https://example.com/file.txt",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(403);
    });

    it("should reject missing name", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            url: "https://example.com/file.txt",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject invalid URL", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "file.txt",
            url: "not-a-valid-url",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /attachments/upload - Upload Files", () => {
    it("should upload file and create attachment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      // Create a mock file
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("files", file);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.attachments).toHaveLength(1);
      expect(data.attachments[0].name).toBe("test.txt");
      expect(data.attachments[0].url).toContain("mock-r2.cloudflare.com");
    });

    it("should upload multiple files", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const file1 = new File(["content 1"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content 2"], "file2.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("files", file1);
      formData.append("files", file2);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.attachments).toHaveLength(2);
    });

    it("should reject empty file list", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const formData = new FormData();
      // No files appended

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("No files");
    });

    it("should reject too many files", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const formData = new FormData();
      // Add 11 files (max is 10)
      for (let i = 0; i < 11; i++) {
        const file = new File([`content ${i}`], `file${i}.txt`, {
          type: "text/plain",
        });
        formData.append("files", file);
      }

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Maximum");
    });

    it("should reject non-member", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.eve);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("files", file);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /attachments - Delete Attachment", () => {
    it("should allow project owner to delete attachment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice); // Owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const attachment = await createTestAttachment(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments?attachmentId=${attachment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.attachment.findUnique({
        where: { id: attachment.id },
      });
      expect(deleted).toBeNull();
    });

    it("should reject non-owner trying to delete", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.bob); // Worker, not owner
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const attachment = await createTestAttachment(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments?attachmentId=${attachment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only project owner");
    });

    it("should require attachmentId parameter", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Attachment ID is required");
    });

    it("should return 404 for non-existent attachment", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments?attachmentId=non-existent-id`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 for attachment in wrong project", async () => {
      const { users, projects } = seededData;
      const mockUser = createMockUserFromSeeded(users.alice);
      mockAuth.mockResolvedValueOnce(createMockSession(mockUser));

      const ticket = await createTestTicket();
      const attachment = await createTestAttachment(ticket.id);

      // Try to delete via wrong project
      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectGamma.id}/tickets/${ticket.id}/attachments?attachmentId=${attachment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
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
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        { method: "GET" }
      );

      const response = await GET_ATTACHMENTS(request, {
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
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "file.txt",
            url: "https://example.com/file.txt",
          }),
        }
      );

      const response = await POST_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated upload request", async () => {
      const { projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();

      const formData = new FormData();
      formData.append("files", new File(["test"], "test.txt"));

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await UPLOAD_FILES(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unauthenticated DELETE request", async () => {
      const { users, projects } = seededData;
      mockAuth.mockResolvedValueOnce(null);

      const ticket = await createTestTicket();
      const attachment = await createTestAttachment(ticket.id);

      const request = new NextRequest(
        `http://localhost/api/projects/${projects.projectAlpha.id}/tickets/${ticket.id}/attachments?attachmentId=${attachment.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE_ATTACHMENT(request, {
        params: Promise.resolve({
          projectId: projects.projectAlpha.id,
          ticketId: ticket.id,
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
