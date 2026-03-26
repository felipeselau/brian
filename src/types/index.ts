import { User, Project, Request, Comment, Attachment, ProjectMember, UserRole, ProjectStatus, RequestStatus } from "@prisma/client";

// Re-export Prisma types
export type { User, Project, Request, Comment, Attachment, ProjectMember };
export { UserRole, ProjectStatus, RequestStatus };

// Extended types with relations
export type ProjectWithRelations = Project & {
  owner: User;
  members: (ProjectMember & { user: User })[];
  requests: Request[];
};

export type RequestWithRelations = Request & {
  project: Project;
  assignedTo: User | null;
  createdBy: User;
  comments: (Comment & { user: User })[];
  attachments: Attachment[];
};

export type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

// Column type for board
export interface BoardColumn {
  id: string;
  title: string;
  order: number;
}

// Project settings
export interface ProjectSettings {
  requireEstimateBeforeStart: boolean;
  estimateRequired: boolean;
}

// Approvals
export interface RequestApprovals {
  owner?: boolean;
  client?: boolean;
}

// Lifecycle log entry
export interface LifecycleLogEntry {
  action: string;
  from: string | null;
  to: string | null;
  by: string;
  at: string;
  metadata?: Record<string, any>;
}

// Default columns template
export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "backlog", title: "Backlog", order: 0 },
  { id: "in_progress", title: "In Progress", order: 1 },
  { id: "review", title: "Review", order: 2 },
  { id: "done", title: "Done", order: 3 },
];

// Default project settings
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  requireEstimateBeforeStart: false,
  estimateRequired: false,
};

// Default approvals
export const DEFAULT_APPROVALS: RequestApprovals = {
  owner: undefined,
  client: undefined,
};
