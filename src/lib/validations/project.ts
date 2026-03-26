import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  columns: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      order: z.number(),
    })
  ).optional(),
  settings: z.object({
    requireEstimateBeforeStart: z.boolean(),
    estimateRequired: z.boolean(),
  }).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  columns: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      order: z.number(),
    })
  ).optional(),
  settings: z.object({
    requireEstimateBeforeStart: z.boolean(),
    estimateRequired: z.boolean(),
  }).optional(),
});

export const projectSettingsSchema = z.object({
  requireEstimateBeforeStart: z.boolean(),
  estimateRequired: z.boolean(),
});

export const boardColumnsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    order: z.number(),
  })
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectSettingsInput = z.infer<typeof projectSettingsSchema>;
export type BoardColumnsInput = z.infer<typeof boardColumnsSchema>;
