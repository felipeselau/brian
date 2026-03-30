import { describe, it, expect } from "vitest";
import {
  createChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "@/lib/validations/checklist";

describe("Checklist validations", () => {
  describe("createChecklistSchema", () => {
    it("accepts valid checklist data", () => {
      const result = createChecklistSchema.safeParse({
        title: "My Checklist",
      });

      expect(result.success).toBe(true);
    });

    it("accepts checklist with items", () => {
      const result = createChecklistSchema.safeParse({
        title: "My Checklist",
        items: [{ content: "Task 1" }, { content: "Task 2" }, { content: "Task 3" }],
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const result = createChecklistSchema.safeParse({
        title: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects title longer than 100 characters", () => {
      const result = createChecklistSchema.safeParse({
        title: "A".repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it("rejects items with empty content", () => {
      const result = createChecklistSchema.safeParse({
        title: "My Checklist",
        items: [{ content: "" }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("accepts checklist without items", () => {
      const result = createChecklistSchema.safeParse({
        title: "Empty Checklist",
      });

      expect(result.success).toBe(true);
    });

    it("accepts checklist with empty items array", () => {
      const result = createChecklistSchema.safeParse({
        title: "Checklist",
        items: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createChecklistItemSchema", () => {
    it("accepts valid item data", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "New task",
      });

      expect(result.success).toBe(true);
    });

    it("accepts item with position", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "New task",
        position: 5,
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty content", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects negative position", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "Task",
        position: -1,
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-integer position", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "Task",
        position: 3.5,
      });

      expect(result.success).toBe(false);
    });

    it("accepts position 0", () => {
      const result = createChecklistItemSchema.safeParse({
        content: "First task",
        position: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("updateChecklistItemSchema", () => {
    it("accepts item id with content update", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        content: "Updated content",
      });

      expect(result.success).toBe(true);
    });

    it("accepts item id with completed update", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        completed: true,
      });

      expect(result.success).toBe(true);
    });

    it("accepts item id with position update", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        position: 2,
      });

      expect(result.success).toBe(true);
    });

    it("accepts all fields update", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        content: "Updated task",
        completed: true,
        position: 1,
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing itemId", () => {
      const result = updateChecklistItemSchema.safeParse({
        content: "Updated content",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty itemId", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "",
        content: "Updated content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects empty content when provided", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        content: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-boolean completed value", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        completed: "yes",
      });

      expect(result.success).toBe(false);
    });

    it("rejects negative position", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        position: -5,
      });

      expect(result.success).toBe(false);
    });

    it("accepts toggling completed to false", () => {
      const result = updateChecklistItemSchema.safeParse({
        itemId: "item-123",
        completed: false,
      });

      expect(result.success).toBe(true);
    });
  });
});
