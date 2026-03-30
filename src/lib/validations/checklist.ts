import { z } from "zod";

export const createChecklistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  items: z
    .array(
      z.object({
        content: z.string().min(1, "Item content is required"),
      })
    )
    .optional(),
});

export const createChecklistItemSchema = z.object({
  content: z.string().min(1, "Item content is required"),
  position: z.number().int().min(0).optional(),
});

export const updateChecklistItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  content: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
