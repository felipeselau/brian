import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["WORKER", "CLIENT"], {
    required_error: "Role must be WORKER or CLIENT",
  }),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
