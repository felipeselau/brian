import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  mentions: z.array(z.string()).optional().default([]),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  mentions: z.array(z.string()).optional().default([]),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
