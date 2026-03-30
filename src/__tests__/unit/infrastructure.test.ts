import { describe, it, expect, beforeEach } from "vitest";
import { prismaTest, seedTestData, resetDatabase } from "../setup/test-db";
import { USERS, PROJECTS } from "../setup/fixtures";

describe("Test Infrastructure", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe("Database Setup", () => {
    it("should reset database successfully", async () => {
      const userCount = await prismaTest.user.count();
      expect(userCount).toBe(0);
    });

    it("should seed test data successfully", async () => {
      const data = await seedTestData();

      expect(data.users.alice.email).toBe(USERS.ALICE.email);
      expect(data.users.alice.role).toBe("OWNER");

      expect(data.users.bob.email).toBe(USERS.BOB.email);
      expect(data.users.bob.role).toBe("WORKER");

      expect(data.projects.projectAlpha.title).toBe(PROJECTS.ALPHA.title);
      expect(data.projects.projectAlpha.status).toBe("ACTIVE");
    });

    it("should create 6 users", async () => {
      await seedTestData();
      const userCount = await prismaTest.user.count();
      expect(userCount).toBe(6);
    });

    it("should create 3 projects", async () => {
      await seedTestData();
      const projectCount = await prismaTest.project.count();
      expect(projectCount).toBe(3);
    });

    it("should create 15 tickets", async () => {
      await seedTestData();
      const ticketCount = await prismaTest.ticket.count();
      expect(ticketCount).toBe(15);
    });

    it("should create project members", async () => {
      await seedTestData();
      const memberCount = await prismaTest.projectMember.count();
      expect(memberCount).toBe(5);
    });
  });

  describe("Fixtures", () => {
    it("should export user constants", () => {
      expect(USERS.ALICE.email).toBe("alice@brian.dev");
      expect(USERS.ALICE.role).toBe("OWNER");
      expect(USERS.BOB.role).toBe("WORKER");
      expect(USERS.DIANA.role).toBe("CLIENT");
    });

    it("should export project constants", () => {
      expect(PROJECTS.ALPHA.title).toBe("Project Alpha");
      expect(PROJECTS.ALPHA.status).toBe("ACTIVE");
      expect(PROJECTS.BETA.status).toBe("ARCHIVED");
      expect(PROJECTS.GAMMA.settings.requireEstimateBeforeStart).toBe(true);
    });
  });

  describe("User Roles", () => {
    it("should have correct role distribution", async () => {
      await seedTestData();

      const owners = await prismaTest.user.count({ where: { role: "OWNER" } });
      const workers = await prismaTest.user.count({ where: { role: "WORKER" } });
      const clients = await prismaTest.user.count({ where: { role: "CLIENT" } });

      expect(owners).toBe(2);
      expect(workers).toBe(2);
      expect(clients).toBe(2);
    });
  });

  describe("Project Settings", () => {
    it("should have flexible settings in Project Alpha", async () => {
      const data = await seedTestData();
      const settings = data.projects.projectAlpha.settings as any;

      expect(settings.requireEstimateBeforeStart).toBe(false);
      expect(settings.estimateRequired).toBe(false);
    });

    it("should have strict settings in Project Gamma", async () => {
      const data = await seedTestData();
      const settings = data.projects.projectGamma.settings as any;

      expect(settings.requireEstimateBeforeStart).toBe(true);
      expect(settings.estimateRequired).toBe(true);
    });
  });

  describe("Ticket Statuses", () => {
    it("should have tickets in various statuses", async () => {
      await seedTestData();

      const backlog = await prismaTest.ticket.count({ where: { status: "BACKLOG" } });
      const inProgress = await prismaTest.ticket.count({ where: { status: "IN_PROGRESS" } });
      const review = await prismaTest.ticket.count({ where: { status: "REVIEW" } });
      const done = await prismaTest.ticket.count({ where: { status: "DONE" } });
      const blocked = await prismaTest.ticket.count({ where: { status: "BLOCKED" } });
      const waiting = await prismaTest.ticket.count({ where: { status: "WAITING" } });

      expect(backlog).toBeGreaterThan(0);
      expect(inProgress).toBeGreaterThan(0);
      expect(review).toBeGreaterThan(0);
      expect(done).toBeGreaterThan(0);
      expect(blocked).toBeGreaterThan(0);
      expect(waiting).toBeGreaterThan(0);
    });
  });
});
