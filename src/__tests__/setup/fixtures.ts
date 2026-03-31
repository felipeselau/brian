import { UserRole, ProjectStatus, TicketStatus, InviteStatus } from "@prisma/client";

export const TEST_PASSWORD = "password123";

export const USERS = {
  ALICE: {
    email: "alice@brian.dev",
    name: "Alice Owner",
    role: "OWNER" as UserRole,
  },
  BOB: {
    email: "bob@brian.dev",
    name: "Bob Worker",
    role: "WORKER" as UserRole,
  },
  CHARLIE: {
    email: "charlie@brian.dev",
    name: "Charlie Worker",
    role: "WORKER" as UserRole,
  },
  DIANA: {
    email: "diana@brian.dev",
    name: "Diana Client",
    role: "CLIENT" as UserRole,
  },
  EVE: {
    email: "eve@brian.dev",
    name: "Eve Client",
    role: "CLIENT" as UserRole,
  },
  FRANK: {
    email: "frank@brian.dev",
    name: "Frank Owner",
    role: "OWNER" as UserRole,
  },
};

export const PROJECTS = {
  ALPHA: {
    title: "Project Alpha",
    description: "Active project with multiple tickets",
    startDate: new Date("2026-01-01"),
    status: "ACTIVE" as ProjectStatus,
    columns: [
      { id: "backlog", title: "Backlog", order: 0 },
      { id: "in_progress", title: "In Progress", order: 1 },
      { id: "review", title: "Review", order: 2 },
      { id: "done", title: "Done", order: 3 },
    ],
    settings: {
      requireEstimateBeforeStart: false,
      estimateRequired: false,
    },
  },
  BETA: {
    title: "Project Beta",
    description: "Archived project",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-12-31"),
    status: "ARCHIVED" as ProjectStatus,
    columns: [
      { id: "backlog", title: "Backlog", order: 0 },
      { id: "done", title: "Done", order: 1 },
    ],
    settings: {
      requireEstimateBeforeStart: false,
      estimateRequired: false,
    },
  },
  GAMMA: {
    title: "Project Gamma",
    description: "Strict project requiring estimates",
    startDate: new Date("2026-02-01"),
    status: "ACTIVE" as ProjectStatus,
    columns: [
      { id: "backlog", title: "Backlog", order: 0 },
      { id: "in_progress", title: "In Progress", order: 1 },
      { id: "review", title: "Review", order: 2 },
      { id: "done", title: "Done", order: 3 },
    ],
    settings: {
      requireEstimateBeforeStart: true,
      estimateRequired: true,
    },
  },
};

export const TICKETS = {
  AUTH_SETUP: {
    title: "Setup authentication",
    description: "Implement NextAuth with credentials provider",
    status: "DONE" as TicketStatus,
    estimatedHours: 8,
    loggedHours: 7.5,
    approvals: { owner: true, client: true },
  },
  BOARD_UI: {
    title: "Design project board UI",
    description: "Create Kanban board with drag and drop",
    status: "IN_PROGRESS" as TicketStatus,
    estimatedHours: 16,
    loggedHours: 10,
    dueDate: new Date("2026-04-15"),
    approvals: {},
  },
  LOGIN_BUG: {
    title: "Fix login bug on mobile",
    description: "Users cannot login on iOS Safari",
    status: "REVIEW" as TicketStatus,
    estimatedHours: 4,
    loggedHours: 3,
    isClientRequest: true,
    approvals: { owner: false },
  },
  EXPORT_CSV: {
    title: "Add export to CSV feature",
    description: "Allow users to export project data",
    status: "BACKLOG" as TicketStatus,
    isClientRequest: true,
    approvals: {},
  },
  DB_OPTIMIZATION: {
    title: "Database optimization",
    description: "Add indexes and optimize queries",
    status: "BACKLOG" as TicketStatus,
    estimatedHours: 12,
    approvals: {},
  },
  BLOCKED_TASK: {
    title: "Blocked task waiting for API",
    description: "Cannot proceed until third-party API is ready",
    status: "BLOCKED" as TicketStatus,
    estimatedHours: 6,
    loggedHours: 1,
    approvals: {},
  },
  WAITING_FEEDBACK: {
    title: "Waiting for client feedback",
    description: "Design mockups sent, awaiting approval",
    status: "WAITING" as TicketStatus,
    estimatedHours: 2,
    loggedHours: 8,
    approvals: {},
  },
};

export const LABELS = {
  BUG: {
    name: "Bug",
    color: "#ef4444",
  },
  FEATURE: {
    name: "Feature",
    color: "#3b82f6",
  },
  URGENT: {
    name: "Urgent",
    color: "#f59e0b",
  },
};

export const COMMENTS = {
  PRAISE: {
    content: "Great work on this! 🎉",
  },
  ISSUE_FOUND: {
    content: "Found a small issue with the mobile layout",
  },
  READY_FOR_DEPLOY: {
    content: "Testing looks good, ready for deployment",
  },
  URGENT_REQUEST: {
    content: "We need this feature ASAP for the next release",
  },
};

export const ATTACHMENTS = {
  MOCKUP_PNG: {
    name: "mockup-v1.png",
    url: "https://mock-r2.cloudflare.com/uploads/mockup-v1.png",
    size: 245600,
    type: "image/png",
  },
  DESIGN_PDF: {
    name: "design-specs.pdf",
    url: "https://mock-r2.cloudflare.com/uploads/design-specs.pdf",
    size: 1048576,
    type: "application/pdf",
  },
  SCREENSHOT_JPG: {
    name: "screenshot-bug.jpg",
    url: "https://mock-r2.cloudflare.com/uploads/screenshot-bug.jpg",
    size: 189440,
    type: "image/jpeg",
  },
  SECURITY_REPORT: {
    name: "security-report.pdf",
    url: "https://mock-r2.cloudflare.com/uploads/security-report.pdf",
    size: 2097152,
    type: "application/pdf",
  },
};

export const CHECKLISTS = {
  AUTH_TASKS: {
    title: "Authentication Tasks",
    items: [
      { content: "Setup NextAuth configuration", completed: true },
      { content: "Add login page", completed: true },
      { content: "Add register page", completed: true },
      { content: "Test authentication flow", completed: true },
    ],
  },
  DESIGN_CHECKLIST: {
    title: "Design Checklist",
    items: [
      { content: "Create wireframes", completed: true },
      { content: "Design high-fidelity mockups", completed: true },
      { content: "Implement drag and drop", completed: false },
      { content: "Add animations", completed: false },
      { content: "Test on mobile devices", completed: false },
    ],
  },
  SECURITY_CHECKS: {
    title: "Security Checks",
    items: [
      { content: "SQL injection testing", completed: true },
      { content: "XSS vulnerability check", completed: true },
      { content: "CSRF protection verification", completed: true },
      { content: "Authentication bypass testing", completed: true },
      { content: "Rate limiting verification", completed: false },
    ],
  },
};

export const INVITES = {
  PENDING_WORKER: {
    email: "newworker@brian.dev",
    token: "invite-token-worker-123",
    role: "WORKER" as UserRole,
    status: "PENDING" as InviteStatus,
    expiresAt: new Date("2026-04-30"),
  },
  PENDING_CLIENT: {
    email: "newclient@brian.dev",
    token: "invite-token-client-456",
    role: "CLIENT" as UserRole,
    status: "PENDING" as InviteStatus,
    expiresAt: new Date("2026-04-30"),
  },
  EXPIRED: {
    email: "expired@brian.dev",
    token: "invite-token-expired-789",
    role: "WORKER" as UserRole,
    status: "EXPIRED" as InviteStatus,
    expiresAt: new Date("2026-01-01"),
  },
};

export const REACTIONS = {
  THUMBS_UP: "👍",
  PARTY: "🎉",
  EYES: "👀",
  ROCKET: "🚀",
};

export const LIFECYCLE_ACTIONS = {
  STATUS_CHANGE: "status_change",
  ESTIMATE_ADDED: "estimate_added",
  HOURS_LOGGED: "hours_logged",
  APPROVAL_GIVEN: "approval_given",
  ASSIGNED: "assigned",
  UNASSIGNED: "unassigned",
};
