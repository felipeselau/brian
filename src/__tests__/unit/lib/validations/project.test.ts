import { describe, it, expect } from "vitest";
import { ProjectStatus } from "@prisma/client";
import {
  createProjectSchema,
  updateProjectSchema,
  projectSettingsSchema,
  boardColumnsSchema,
} from "@/lib/validations/project";

describe("Project validations", () => {
  describe("createProjectSchema", () => {
    it("accepts valid project data", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        description: "A new project description",
        startDate: new Date("2026-01-01"),
        columns: [
          { id: "backlog", title: "Backlog", order: 0 },
          { id: "done", title: "Done", order: 1 },
        ],
        settings: {
          requireEstimateBeforeStart: false,
          estimateRequired: false,
        },
      });

      expect(result.success).toBe(true);
    });

    it("accepts valid project with minimal fields", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: new Date("2026-01-01"),
      });

      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 3 characters", () => {
      const result = createProjectSchema.safeParse({
        title: "AB",
        startDate: new Date("2026-01-01"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("rejects title longer than 100 characters", () => {
      const result = createProjectSchema.safeParse({
        title: "A".repeat(101),
        startDate: new Date("2026-01-01"),
      });

      expect(result.success).toBe(false);
    });

    it("accepts startDate as string", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
      });

      expect(result.success).toBe(true);
    });

    it("accepts startDate as Date object", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: new Date("2026-01-01"),
      });

      expect(result.success).toBe(true);
    });

    it("accepts endDate as string", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

      expect(result.success).toBe(true);
    });

    it("accepts endDate as null", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        endDate: null,
      });

      expect(result.success).toBe(true);
    });

    it("validates columns array structure", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        columns: [
          { id: "backlog", title: "Backlog", order: 0 },
          { id: "in_progress", title: "In Progress", order: 1 },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid columns structure", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        columns: [{ id: "backlog" }],
      });

      expect(result.success).toBe(false);
    });

    it("validates settings object structure", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        settings: {
          requireEstimateBeforeStart: true,
          estimateRequired: true,
        },
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid settings structure", () => {
      const result = createProjectSchema.safeParse({
        title: "New Project",
        startDate: "2026-01-01",
        settings: {
          requireEstimateBeforeStart: "yes",
          estimateRequired: true,
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("accepts valid partial update", () => {
      const result = updateProjectSchema.safeParse({
        title: "Updated Project",
      });

      expect(result.success).toBe(true);
    });

    it("accepts status update with enum value", () => {
      const result = updateProjectSchema.safeParse({
        status: ProjectStatus.ACTIVE,
      });

      expect(result.success).toBe(true);
    });

    it("accepts ARCHIVED status", () => {
      const result = updateProjectSchema.safeParse({
        status: ProjectStatus.ARCHIVED,
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid status value", () => {
      const result = updateProjectSchema.safeParse({
        status: "INVALID_STATUS",
      });

      expect(result.success).toBe(false);
    });

    it("accepts description as null", () => {
      const result = updateProjectSchema.safeParse({
        description: null,
      });

      expect(result.success).toBe(true);
    });

    it("validates title length when provided", () => {
      const result = updateProjectSchema.safeParse({
        title: "AB",
      });

      expect(result.success).toBe(false);
    });

    it("accepts all fields update", () => {
      const result = updateProjectSchema.safeParse({
        title: "Updated Project",
        description: "Updated description",
        startDate: "2026-01-15",
        endDate: "2026-12-31",
        status: ProjectStatus.ACTIVE,
        columns: [{ id: "backlog", title: "Backlog", order: 0 }],
        settings: {
          requireEstimateBeforeStart: false,
          estimateRequired: true,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("projectSettingsSchema", () => {
    it("accepts valid settings", () => {
      const result = projectSettingsSchema.safeParse({
        requireEstimateBeforeStart: true,
        estimateRequired: false,
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing requireEstimateBeforeStart", () => {
      const result = projectSettingsSchema.safeParse({
        estimateRequired: false,
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing estimateRequired", () => {
      const result = projectSettingsSchema.safeParse({
        requireEstimateBeforeStart: true,
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-boolean values", () => {
      const result = projectSettingsSchema.safeParse({
        requireEstimateBeforeStart: "yes",
        estimateRequired: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("boardColumnsSchema", () => {
    it("accepts valid columns array", () => {
      const result = boardColumnsSchema.safeParse([
        { id: "backlog", title: "Backlog", order: 0 },
        { id: "in_progress", title: "In Progress", order: 1 },
        { id: "done", title: "Done", order: 2 },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      const result = boardColumnsSchema.safeParse([]);

      expect(result.success).toBe(true);
    });

    it("rejects column without id", () => {
      const result = boardColumnsSchema.safeParse([{ title: "Backlog", order: 0 }]);

      expect(result.success).toBe(false);
    });

    it("rejects column without title", () => {
      const result = boardColumnsSchema.safeParse([{ id: "backlog", order: 0 }]);

      expect(result.success).toBe(false);
    });

    it("rejects column without order", () => {
      const result = boardColumnsSchema.safeParse([{ id: "backlog", title: "Backlog" }]);

      expect(result.success).toBe(false);
    });

    it("rejects non-numeric order value", () => {
      const result = boardColumnsSchema.safeParse([
        { id: "backlog", title: "Backlog", order: "0" },
      ]);

      expect(result.success).toBe(false);
    });
  });
});
