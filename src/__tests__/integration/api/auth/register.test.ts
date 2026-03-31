/**
 * Integration Tests: POST /api/auth/register
 *
 * Tests user registration flows:
 * - Direct OWNER registration
 * - Invite-based registration (WORKER, CLIENT)
 * - Validation errors
 * - Edge cases (expired invites, duplicate users, etc.)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import prisma from "@/lib/prisma";
import { resetDatabase, seedTestData } from "@/__tests__/setup/test-db";
import { USERS } from "@/__tests__/setup/fixtures";
import bcrypt from "bcryptjs";

describe("POST /api/auth/register", () => {
  let seededData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedTestData();
  });

  describe("Direct OWNER Registration", () => {
    it("should allow owner registration with valid data", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "New Owner",
          email: "newowner@test.com",
          password: "password123",
          role: "OWNER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toMatchObject({
        name: "New Owner",
        email: "newowner@test.com",
        role: "OWNER",
      });
      expect(data.user.id).toBeDefined();
      expect(data.user.password).toBeUndefined(); // Should not return password

      // Verify user was created in DB
      const user = await prisma.user.findUnique({
        where: { email: "newowner@test.com" },
      });
      expect(user).toBeDefined();
      expect(user!.role).toBe("OWNER");

      // Verify password was hashed
      if (user!.password) {
        const passwordMatch = await bcrypt.compare("password123", user!.password);
        expect(passwordMatch).toBe(true);
      }
    });

    it("should reject registration without role field", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Worker Attempt",
          email: "worker@test.com",
          password: "password123",
          // No role field
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Only owners can register directly");
    });

    it("should reject registration with non-OWNER role (no token)", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Worker Attempt",
          email: "worker@test.com",
          password: "password123",
          role: "WORKER", // Invalid - needs invite token
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should fail validation since schema only accepts OWNER for direct registration
      expect(response.status).toBe(400);
    });

    it("should reject duplicate email", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Alice Duplicate",
          email: USERS.ALICE.email, // Already exists
          password: "password123",
          role: "OWNER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User already exists");
    });

    it("should reject invalid email format", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Invalid Email",
          email: "not-an-email",
          password: "password123",
          role: "OWNER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid email");
    });

    it("should reject short password", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Short Pass",
          email: "short@test.com",
          password: "12345", // Too short
          role: "OWNER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Password must be at least 6 characters");
    });

    it("should reject short name", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "A", // Too short
          email: "shortname@test.com",
          password: "password123",
          role: "OWNER",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Name must be at least 2 characters");
    });
  });

  describe("Invite-Based Registration", () => {
    it("should allow registration with valid PENDING invite", async () => {
      const { users, projects } = seededData;

      // Create a pending invite
      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectAlpha.id,
          email: "invited-worker@test.com",
          role: "WORKER",
          token: "valid-token-123",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Invited Worker",
          email: "invited-worker@test.com",
          password: "password123",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toMatchObject({
        name: "Invited Worker",
        email: "invited-worker@test.com",
        role: "WORKER",
      });
      expect(data.message).toContain("Account created and added to project");

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: "invited-worker@test.com" },
      });
      expect(user).toBeDefined();
      expect(user!.role).toBe("WORKER");

      // Verify user was added as project member
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectAlpha.id,
            userId: user!.id,
          },
        },
      });
      expect(member).toBeDefined();
      expect(member!.role).toBe("WORKER");

      // Verify invite status was updated
      const updatedInvite = await prisma.invite.findUnique({
        where: { id: invite.id },
      });
      expect(updatedInvite!.status).toBe("ACCEPTED");
    });

    it("should add existing user to project with valid invite", async () => {
      const { users, projects } = seededData;

      // Create invite for existing user (Bob) to Beta project (not a member)
      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectBeta.id,
          email: users.bob.email,
          role: "WORKER",
          token: "bob-invite-token",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Bob",
          email: users.bob.email,
          password: "anypassword",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.email).toBe(users.bob.email);
      expect(data.message).toContain("You have been added to the project");

      // Verify Bob was added to Beta project
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projects.projectBeta.id,
            userId: users.bob.id,
          },
        },
      });
      expect(member).toBeDefined();
      expect(member!.role).toBe("WORKER");

      // Verify invite was marked as accepted
      const updatedInvite = await prisma.invite.findUnique({
        where: { id: invite.id },
      });
      expect(updatedInvite!.status).toBe("ACCEPTED");
    });

    it("should reject registration with invalid token", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Invalid Token User",
          email: "invalid@test.com",
          password: "password123",
          token: "non-existent-token",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid invite token");
    });

    it("should reject registration with used invite (ACCEPTED)", async () => {
      const { users, projects } = seededData;

      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectAlpha.id,
          email: "used@test.com",
          role: "CLIENT",
          token: "used-token",
          status: "ACCEPTED", // Already used
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Used Invite",
          email: "used@test.com",
          password: "password123",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("This invite has already been used");
    });

    it("should reject and mark expired invite", async () => {
      const { users, projects } = seededData;

      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectAlpha.id,
          email: "expired@test.com",
          role: "WORKER",
          token: "expired-token",
          status: "PENDING",
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Expired Invite",
          email: "expired@test.com",
          password: "password123",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("This invite has expired");

      // Verify invite was marked as expired
      const updatedInvite = await prisma.invite.findUnique({
        where: { id: invite.id },
      });
      expect(updatedInvite!.status).toBe("EXPIRED");
    });

    it("should reject if existing user is already project member", async () => {
      const { users, projects } = seededData;

      // Create invite for Bob to join Alpha (he's already a member)
      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectAlpha.id, // Bob is already a member
          email: users.bob.email,
          role: "WORKER",
          token: "duplicate-member-token",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Bob",
          email: users.bob.email,
          password: "anypassword",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You are already a member of this project");
    });

    it("should use invite email not request email", async () => {
      const { users, projects } = seededData;

      const invite = await prisma.invite.create({
        data: {
          projectId: projects.projectAlpha.id,
          email: "correct-email@test.com",
          role: "CLIENT",
          token: "email-override-token",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: users.alice.id,
        },
      });

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Email Override",
          email: "wrong-email@test.com", // This should be ignored
          password: "password123",
          token: invite.token,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.email).toBe("correct-email@test.com"); // Invite email used

      // Verify correct email in DB
      const user = await prisma.user.findUnique({
        where: { email: "correct-email@test.com" },
      });
      expect(user).toBeDefined();

      // Verify wrong email was NOT created
      const wrongUser = await prisma.user.findUnique({
        where: { email: "wrong-email@test.com" },
      });
      expect(wrongUser).toBeNull();
    });
  });
});
