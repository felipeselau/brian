import { describe, it, expect } from "vitest";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment";

describe("Comment validations", () => {
  describe("createCommentSchema", () => {
    it("accepts valid comment data", () => {
      const result = createCommentSchema.safeParse({
        content: "This is a valid comment",
      });

      expect(result.success).toBe(true);
    });

    it("accepts comment with mentions", () => {
      const result = createCommentSchema.safeParse({
        content: "Hey @user, check this out",
        mentions: ["user-id-1", "user-id-2"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mentions).toEqual(["user-id-1", "user-id-2"]);
      }
    });

    it("defaults to empty mentions array when not provided", () => {
      const result = createCommentSchema.safeParse({
        content: "Comment without mentions",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mentions).toEqual([]);
      }
    });

    it("rejects empty content", () => {
      const result = createCommentSchema.safeParse({
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("rejects whitespace-only content", () => {
      const result = createCommentSchema.safeParse({
        content: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing content field", () => {
      const result = createCommentSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("validates mentions array structure", () => {
      const result = createCommentSchema.safeParse({
        content: "Valid comment",
        mentions: ["id1", "id2", "id3"],
      });

      expect(result.success).toBe(true);
    });

    it("rejects non-string elements in mentions array", () => {
      const result = createCommentSchema.safeParse({
        content: "Valid comment",
        mentions: ["id1", 123, "id3"],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateCommentSchema", () => {
    it("accepts valid update data", () => {
      const result = updateCommentSchema.safeParse({
        content: "Updated comment content",
      });

      expect(result.success).toBe(true);
    });

    it("accepts update with new mentions", () => {
      const result = updateCommentSchema.safeParse({
        content: "Updated with mentions",
        mentions: ["new-user-id"],
      });

      expect(result.success).toBe(true);
    });

    it("defaults to empty mentions array when not provided", () => {
      const result = updateCommentSchema.safeParse({
        content: "Updated content",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mentions).toEqual([]);
      }
    });

    it("rejects empty content", () => {
      const result = updateCommentSchema.safeParse({
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("allows clearing mentions with empty array", () => {
      const result = updateCommentSchema.safeParse({
        content: "Content without mentions",
        mentions: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mentions).toEqual([]);
      }
    });
  });
});
