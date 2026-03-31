import { describe, it, expect } from "vitest";
import { createInviteSchema, acceptInviteSchema } from "@/lib/validations/invite";

describe("Invite validations", () => {
  describe("createInviteSchema", () => {
    it("accepts valid invite for WORKER", () => {
      const result = createInviteSchema.safeParse({
        email: "worker@example.com",
        role: "WORKER",
      });

      expect(result.success).toBe(true);
    });

    it("accepts valid invite for CLIENT", () => {
      const result = createInviteSchema.safeParse({
        email: "client@example.com",
        role: "CLIENT",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invite with OWNER role", () => {
      const result = createInviteSchema.safeParse({
        email: "owner@example.com",
        role: "OWNER",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = createInviteSchema.safeParse({
        email: "not-an-email",
        role: "WORKER",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("rejects email without domain", () => {
      const result = createInviteSchema.safeParse({
        email: "user@",
        role: "WORKER",
      });

      expect(result.success).toBe(false);
    });

    it("rejects email without @", () => {
      const result = createInviteSchema.safeParse({
        email: "userexample.com",
        role: "WORKER",
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing role", () => {
      const result = createInviteSchema.safeParse({
        email: "user@example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("WORKER or CLIENT");
      }
    });

    it("rejects invalid role value", () => {
      const result = createInviteSchema.safeParse({
        email: "user@example.com",
        role: "ADMIN",
      });

      expect(result.success).toBe(false);
    });

    it("accepts email with subdomain", () => {
      const result = createInviteSchema.safeParse({
        email: "user@subdomain.example.com",
        role: "WORKER",
      });

      expect(result.success).toBe(true);
    });

    it("accepts email with plus sign", () => {
      const result = createInviteSchema.safeParse({
        email: "user+tag@example.com",
        role: "CLIENT",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("acceptInviteSchema", () => {
    it("accepts valid invite acceptance data", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token-123",
        name: "John Doe",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing token", () => {
      const result = acceptInviteSchema.safeParse({
        name: "John Doe",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty token", () => {
      const result = acceptInviteSchema.safeParse({
        token: "",
        name: "John Doe",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects name shorter than 2 characters", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "J",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("accepts name exactly 2 characters", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "Jo",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 6 characters", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "John Doe",
        password: "12345",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 6 characters");
      }
    });

    it("accepts password exactly 6 characters", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "John Doe",
        password: "123456",
      });

      expect(result.success).toBe(true);
    });

    it("accepts long password", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "John Doe",
        password: "very-secure-long-password-123",
      });

      expect(result.success).toBe(true);
    });

    it("accepts name with special characters", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "O'Brien-Smith Jr.",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const result = acceptInviteSchema.safeParse({
        token: "valid-token",
        name: "John Doe",
      });

      expect(result.success).toBe(false);
    });
  });
});
