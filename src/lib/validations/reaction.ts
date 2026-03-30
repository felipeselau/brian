import { z } from "zod";

export const ALLOWED_EMOJIS = ["👍", "❤️", "😄", "🎉", "🚀", "👀", "👎", "😕"] as const;

export const reactionSchema = z.object({
  emoji: z.enum(ALLOWED_EMOJIS, {
    errorMap: () => ({ message: "Invalid emoji. Allowed: 👍 ❤️ 😄 🎉 🚀 👀 👎 😕" }),
  }),
});

export type ReactionInput = z.infer<typeof reactionSchema>;
