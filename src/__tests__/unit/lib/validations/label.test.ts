import { describe, it, expect } from "vitest";
import { createLabelSchema, updateTicketLabelsSchema } from "@/lib/validations/label";

describe("Label validations", () => {
  describe("createLabelSchema", () => {
    it("accepts valid label data", () => {
      const result = createLabelSchema.safeParse({
        name: "Bug",
        color: "#ff5733",
      });

      expect(result.success).toBe(true);
    });

    it("accepts uppercase hex color", () => {
      const result = createLabelSchema.safeParse({
        name: "Feature",
        color: "#FF5733",
      });

      expect(result.success).toBe(true);
    });

    it("accepts mixed case hex color", () => {
      const result = createLabelSchema.safeParse({
        name: "Urgent",
        color: "#Ff5733",
      });

      expect(result.success).toBe(true);
    });

    it("rejects hex color without hash symbol", () => {
      const result = createLabelSchema.safeParse({
        name: "Bug",
        color: "ff5733",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid hex color");
      }
    });

    it("rejects hex color with less than 6 digits", () => {
      const result = createLabelSchema.safeParse({
        name: "Bug",
        color: "#ff573",
      });

      expect(result.success).toBe(false);
    });

    it("rejects hex color with more than 6 digits", () => {
      const result = createLabelSchema.safeParse({
        name: "Bug",
        color: "#ff57333",
      });

      expect(result.success).toBe(false);
    });

    it("rejects hex color with invalid characters", () => {
      const result = createLabelSchema.safeParse({
        name: "Bug",
        color: "#gghhii",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createLabelSchema.safeParse({
        name: "",
        color: "#ff5733",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects name longer than 50 characters", () => {
      const result = createLabelSchema.safeParse({
        name: "A".repeat(51),
        color: "#ff5733",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50 characters or less");
      }
    });

    it("accepts name exactly 50 characters", () => {
      const result = createLabelSchema.safeParse({
        name: "A".repeat(50),
        color: "#ff5733",
      });

      expect(result.success).toBe(true);
    });

    it("accepts single character name", () => {
      const result = createLabelSchema.safeParse({
        name: "P",
        color: "#ff5733",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("updateTicketLabelsSchema", () => {
    it("accepts valid label ids array", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: ["label-1", "label-2", "label-3"],
      });

      expect(result.success).toBe(true);
    });

    it("accepts empty label ids array", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: [],
      });

      expect(result.success).toBe(true);
    });

    it("accepts single label id", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: ["label-1"],
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing labelIds field", () => {
      const result = updateTicketLabelsSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("rejects non-array labelIds", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: "label-1",
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-string elements in labelIds array", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: ["label-1", 123, "label-3"],
      });

      expect(result.success).toBe(false);
    });

    it("rejects null as labelIds", () => {
      const result = updateTicketLabelsSchema.safeParse({
        labelIds: null,
      });

      expect(result.success).toBe(false);
    });
  });
});
