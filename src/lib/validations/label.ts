import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color (e.g. #ff5733)"),
});

export const updateTicketLabelsSchema = z.object({
  labelIds: z.array(z.string()),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateTicketLabelsInput = z.infer<typeof updateTicketLabelsSchema>;
