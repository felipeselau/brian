import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export { prismaTest };

export async function resetDatabase() {
  await prismaTest.$transaction([
    prismaTest.reaction.deleteMany(),
    prismaTest.checklistItem.deleteMany(),
    prismaTest.checklist.deleteMany(),
    prismaTest.ticketLabel.deleteMany(),
    prismaTest.label.deleteMany(),
    prismaTest.attachment.deleteMany(),
    prismaTest.comment.deleteMany(),
    prismaTest.ticket.deleteMany(),
    prismaTest.invite.deleteMany(),
    prismaTest.projectMember.deleteMany(),
    prismaTest.project.deleteMany(),
    prismaTest.user.deleteMany(),
  ]);
}

export async function seedTestData() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const alice = await prismaTest.user.create({
    data: {
      email: "alice@brian.dev",
      name: "Alice Owner",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  const bob = await prismaTest.user.create({
    data: {
      email: "bob@brian.dev",
      name: "Bob Worker",
      password: hashedPassword,
      role: "WORKER",
    },
  });

  const charlie = await prismaTest.user.create({
    data: {
      email: "charlie@brian.dev",
      name: "Charlie Worker",
      password: hashedPassword,
      role: "WORKER",
    },
  });

  const diana = await prismaTest.user.create({
    data: {
      email: "diana@brian.dev",
      name: "Diana Client",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const eve = await prismaTest.user.create({
    data: {
      email: "eve@brian.dev",
      name: "Eve Client",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const frank = await prismaTest.user.create({
    data: {
      email: "frank@brian.dev",
      name: "Frank Owner",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  const projectAlpha = await prismaTest.project.create({
    data: {
      title: "Project Alpha",
      description: "Active project with multiple tickets",
      startDate: new Date("2026-01-01"),
      status: "ACTIVE",
      ownerId: alice.id,
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
  });

  const projectBeta = await prismaTest.project.create({
    data: {
      title: "Project Beta",
      description: "Archived project",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-12-31"),
      status: "ARCHIVED",
      ownerId: alice.id,
      columns: [
        { id: "backlog", title: "Backlog", order: 0 },
        { id: "done", title: "Done", order: 1 },
      ],
      settings: {
        requireEstimateBeforeStart: false,
        estimateRequired: false,
      },
    },
  });

  const projectGamma = await prismaTest.project.create({
    data: {
      title: "Project Gamma",
      description: "Strict project requiring estimates",
      startDate: new Date("2026-02-01"),
      status: "ACTIVE",
      ownerId: frank.id,
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
  });

  await prismaTest.projectMember.createMany({
    data: [
      {
        projectId: projectAlpha.id,
        userId: bob.id,
        role: "WORKER",
        canCreateTickets: true,
      },
      {
        projectId: projectAlpha.id,
        userId: charlie.id,
        role: "WORKER",
        canCreateTickets: false,
      },
      {
        projectId: projectAlpha.id,
        userId: diana.id,
        role: "CLIENT",
        canCreateTickets: true,
      },
      {
        projectId: projectGamma.id,
        userId: bob.id,
        role: "WORKER",
        canCreateTickets: true,
      },
      {
        projectId: projectGamma.id,
        userId: eve.id,
        role: "CLIENT",
        canCreateTickets: true,
      },
    ],
  });

  const bugLabel = await prismaTest.label.create({
    data: {
      name: "Bug",
      color: "#ef4444",
      projectId: projectAlpha.id,
    },
  });

  const featureLabel = await prismaTest.label.create({
    data: {
      name: "Feature",
      color: "#3b82f6",
      projectId: projectAlpha.id,
    },
  });

  const urgentLabel = await prismaTest.label.create({
    data: {
      name: "Urgent",
      color: "#f59e0b",
      projectId: projectAlpha.id,
    },
  });

  const ticket1 = await prismaTest.ticket.create({
    data: {
      title: "Setup authentication",
      description: "Implement NextAuth with credentials provider",
      status: "DONE",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: bob.id,
      estimatedHours: 8,
      loggedHours: 7.5,
      position: 0,
      approvals: { owner: true, client: true },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-01-05").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "REVIEW",
          by: bob.id,
          at: new Date("2026-01-08").toISOString(),
          action: "status_change",
        },
        {
          from: "REVIEW",
          to: "DONE",
          by: alice.id,
          at: new Date("2026-01-10").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket2 = await prismaTest.ticket.create({
    data: {
      title: "Design project board UI",
      description: "Create Kanban board with drag and drop",
      status: "IN_PROGRESS",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: charlie.id,
      estimatedHours: 16,
      loggedHours: 10,
      position: 0,
      dueDate: new Date("2026-04-15"),
      approvals: {},
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: charlie.id,
          at: new Date("2026-03-20").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket3 = await prismaTest.ticket.create({
    data: {
      title: "Fix login bug on mobile",
      description: "Users cannot login on iOS Safari",
      status: "REVIEW",
      projectId: projectAlpha.id,
      createdById: diana.id,
      assignedToId: bob.id,
      estimatedHours: 4,
      loggedHours: 3,
      isClientRequest: true,
      position: 0,
      approvals: { owner: false },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-25").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "REVIEW",
          by: bob.id,
          at: new Date("2026-03-28").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket4 = await prismaTest.ticket.create({
    data: {
      title: "Add export to CSV feature",
      description: "Allow users to export project data",
      status: "BACKLOG",
      projectId: projectAlpha.id,
      createdById: diana.id,
      isClientRequest: true,
      position: 0,
      approvals: {},
      lifecycleLog: [],
    },
  });

  const ticket5 = await prismaTest.ticket.create({
    data: {
      title: "Database optimization",
      description: "Add indexes and optimize queries",
      status: "BACKLOG",
      projectId: projectAlpha.id,
      createdById: alice.id,
      estimatedHours: 12,
      position: 1,
      approvals: {},
      lifecycleLog: [],
    },
  });

  const ticket6 = await prismaTest.ticket.create({
    data: {
      title: "Blocked task waiting for API",
      description: "Cannot proceed until third-party API is ready",
      status: "BLOCKED",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: bob.id,
      estimatedHours: 6,
      loggedHours: 1,
      position: 0,
      approvals: {},
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-15").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "BLOCKED",
          by: bob.id,
          at: new Date("2026-03-18").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket7 = await prismaTest.ticket.create({
    data: {
      title: "Waiting for client feedback",
      description: "Design mockups sent, awaiting approval",
      status: "WAITING",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: charlie.id,
      estimatedHours: 2,
      loggedHours: 8,
      position: 0,
      approvals: {},
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: charlie.id,
          at: new Date("2026-03-10").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "WAITING",
          by: charlie.id,
          at: new Date("2026-03-22").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket8 = await prismaTest.ticket.create({
    data: {
      title: "Implement notification system",
      description: "Email and in-app notifications",
      status: "BACKLOG",
      projectId: projectGamma.id,
      createdById: frank.id,
      estimatedHours: 20,
      position: 0,
      approvals: {},
      lifecycleLog: [],
    },
  });

  const ticket9 = await prismaTest.ticket.create({
    data: {
      title: "Setup CI/CD pipeline",
      description: "GitHub Actions for automated testing and deployment",
      status: "IN_PROGRESS",
      projectId: projectGamma.id,
      createdById: frank.id,
      assignedToId: bob.id,
      estimatedHours: 10,
      loggedHours: 5,
      position: 0,
      approvals: {},
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-28").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket10 = await prismaTest.ticket.create({
    data: {
      title: "Write API documentation",
      description: "Complete OpenAPI spec for all endpoints",
      status: "DONE",
      projectId: projectGamma.id,
      createdById: frank.id,
      assignedToId: bob.id,
      estimatedHours: 8,
      loggedHours: 9,
      position: 0,
      approvals: { owner: true },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-01").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "REVIEW",
          by: bob.id,
          at: new Date("2026-03-10").toISOString(),
          action: "status_change",
        },
        {
          from: "REVIEW",
          to: "DONE",
          by: frank.id,
          at: new Date("2026-03-12").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket11 = await prismaTest.ticket.create({
    data: {
      title: "Client urgent request",
      description: "High priority feature from client",
      status: "IN_PROGRESS",
      projectId: projectGamma.id,
      createdById: eve.id,
      assignedToId: bob.id,
      estimatedHours: 15,
      loggedHours: 8,
      isClientRequest: true,
      dueDate: new Date("2026-04-05"),
      position: 1,
      approvals: {},
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-27").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket12 = await prismaTest.ticket.create({
    data: {
      title: "Archived completed feature",
      description: "Old feature that was completed and archived",
      status: "ARCHIVED",
      projectId: projectBeta.id,
      createdById: alice.id,
      assignedToId: bob.id,
      estimatedHours: 5,
      loggedHours: 5,
      position: 0,
      approvals: { owner: true, client: true },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "DONE",
          by: bob.id,
          at: new Date("2025-11-15").toISOString(),
          action: "status_change",
        },
        {
          from: "DONE",
          to: "ARCHIVED",
          by: alice.id,
          at: new Date("2025-12-30").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket13 = await prismaTest.ticket.create({
    data: {
      title: "Performance testing",
      description: "Load testing and optimization",
      status: "BACKLOG",
      projectId: projectAlpha.id,
      createdById: alice.id,
      position: 2,
      approvals: {},
      lifecycleLog: [],
    },
  });

  const ticket14 = await prismaTest.ticket.create({
    data: {
      title: "Security audit",
      description: "Complete security review and fixes",
      status: "REVIEW",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: bob.id,
      estimatedHours: 12,
      loggedHours: 12,
      position: 1,
      coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3",
      approvals: { owner: false },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: bob.id,
          at: new Date("2026-03-01").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "REVIEW",
          by: bob.id,
          at: new Date("2026-03-26").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  const ticket15 = await prismaTest.ticket.create({
    data: {
      title: "Refactor codebase",
      description: "Clean up legacy code and improve structure",
      status: "DONE",
      projectId: projectAlpha.id,
      createdById: alice.id,
      assignedToId: charlie.id,
      estimatedHours: 24,
      loggedHours: 28,
      position: 1,
      approvals: { owner: true },
      lifecycleLog: [
        {
          from: "BACKLOG",
          to: "IN_PROGRESS",
          by: charlie.id,
          at: new Date("2026-02-01").toISOString(),
          action: "status_change",
        },
        {
          from: "IN_PROGRESS",
          to: "REVIEW",
          by: charlie.id,
          at: new Date("2026-02-25").toISOString(),
          action: "status_change",
        },
        {
          from: "REVIEW",
          to: "DONE",
          by: alice.id,
          at: new Date("2026-02-28").toISOString(),
          action: "status_change",
        },
      ],
    },
  });

  await prismaTest.ticketLabel.createMany({
    data: [
      { ticketId: ticket3.id, labelId: bugLabel.id },
      { ticketId: ticket3.id, labelId: urgentLabel.id },
      { ticketId: ticket4.id, labelId: featureLabel.id },
      { ticketId: ticket8.id, labelId: featureLabel.id },
      { ticketId: ticket11.id, labelId: urgentLabel.id },
    ],
  });

  const comment1 = await prismaTest.comment.create({
    data: {
      content: "Great work on this! 🎉",
      ticketId: ticket1.id,
      userId: alice.id,
      mentions: [bob.id],
    },
  });

  const comment2 = await prismaTest.comment.create({
    data: {
      content: "Found a small issue with the mobile layout",
      ticketId: ticket2.id,
      userId: diana.id,
      mentions: [charlie.id],
    },
  });

  const comment3 = await prismaTest.comment.create({
    data: {
      content: "Testing looks good, ready for deployment",
      ticketId: ticket3.id,
      userId: bob.id,
    },
  });

  const comment4 = await prismaTest.comment.create({
    data: {
      content: "We need this feature ASAP for the next release",
      ticketId: ticket11.id,
      userId: eve.id,
      mentions: [bob.id, frank.id],
    },
  });

  await prismaTest.reaction.createMany({
    data: [
      { commentId: comment1.id, userId: bob.id, emoji: "👍" },
      { commentId: comment1.id, userId: charlie.id, emoji: "🎉" },
      { commentId: comment2.id, userId: charlie.id, emoji: "👀" },
      { commentId: comment4.id, userId: frank.id, emoji: "🚀" },
    ],
  });

  await prismaTest.attachment.createMany({
    data: [
      {
        ticketId: ticket2.id,
        name: "mockup-v1.png",
        url: "https://mock-r2.cloudflare.com/uploads/mockup-v1.png",
        size: 245600,
        type: "image/png",
      },
      {
        ticketId: ticket2.id,
        name: "design-specs.pdf",
        url: "https://mock-r2.cloudflare.com/uploads/design-specs.pdf",
        size: 1048576,
        type: "application/pdf",
      },
      {
        ticketId: ticket3.id,
        name: "screenshot-bug.jpg",
        url: "https://mock-r2.cloudflare.com/uploads/screenshot-bug.jpg",
        size: 189440,
        type: "image/jpeg",
      },
      {
        ticketId: ticket14.id,
        name: "security-report.pdf",
        url: "https://mock-r2.cloudflare.com/uploads/security-report.pdf",
        size: 2097152,
        type: "application/pdf",
      },
    ],
  });

  const checklist1 = await prismaTest.checklist.create({
    data: {
      title: "Authentication Tasks",
      ticketId: ticket1.id,
      position: 0,
    },
  });

  const checklist2 = await prismaTest.checklist.create({
    data: {
      title: "Design Checklist",
      ticketId: ticket2.id,
      position: 0,
    },
  });

  const checklist3 = await prismaTest.checklist.create({
    data: {
      title: "Security Checks",
      ticketId: ticket14.id,
      position: 0,
    },
  });

  await prismaTest.checklistItem.createMany({
    data: [
      {
        checklistId: checklist1.id,
        content: "Setup NextAuth configuration",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklist1.id,
        content: "Add login page",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklist1.id,
        content: "Add register page",
        completed: true,
        position: 2,
      },
      {
        checklistId: checklist1.id,
        content: "Test authentication flow",
        completed: true,
        position: 3,
      },
      {
        checklistId: checklist2.id,
        content: "Create wireframes",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklist2.id,
        content: "Design high-fidelity mockups",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklist2.id,
        content: "Implement drag and drop",
        completed: false,
        position: 2,
      },
      {
        checklistId: checklist2.id,
        content: "Add animations",
        completed: false,
        position: 3,
      },
      {
        checklistId: checklist2.id,
        content: "Test on mobile devices",
        completed: false,
        position: 4,
      },
      {
        checklistId: checklist3.id,
        content: "SQL injection testing",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklist3.id,
        content: "XSS vulnerability check",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklist3.id,
        content: "CSRF protection verification",
        completed: true,
        position: 2,
      },
      {
        checklistId: checklist3.id,
        content: "Authentication bypass testing",
        completed: true,
        position: 3,
      },
      {
        checklistId: checklist3.id,
        content: "Rate limiting verification",
        completed: false,
        position: 4,
      },
    ],
  });

  await prismaTest.invite.createMany({
    data: [
      {
        email: "newworker@brian.dev",
        token: "invite-token-worker-123",
        role: "WORKER",
        status: "PENDING",
        projectId: projectAlpha.id,
        invitedById: alice.id,
        expiresAt: new Date("2026-04-30"),
      },
      {
        email: "newclient@brian.dev",
        token: "invite-token-client-456",
        role: "CLIENT",
        status: "PENDING",
        projectId: projectGamma.id,
        invitedById: frank.id,
        expiresAt: new Date("2026-04-30"),
      },
      {
        email: "expired@brian.dev",
        token: "invite-token-expired-789",
        role: "WORKER",
        status: "EXPIRED",
        projectId: projectAlpha.id,
        invitedById: alice.id,
        expiresAt: new Date("2026-01-01"),
      },
    ],
  });

  return {
    users: {
      alice,
      bob,
      charlie,
      diana,
      eve,
      frank,
    },
    projects: {
      projectAlpha,
      projectBeta,
      projectGamma,
    },
    tickets: {
      ticket1,
      ticket2,
      ticket3,
      ticket4,
      ticket5,
      ticket6,
      ticket7,
      ticket8,
      ticket9,
      ticket10,
      ticket11,
      ticket12,
      ticket13,
      ticket14,
      ticket15,
    },
    labels: {
      bugLabel,
      featureLabel,
      urgentLabel,
    },
    comments: {
      comment1,
      comment2,
      comment3,
      comment4,
    },
    checklists: {
      checklist1,
      checklist2,
      checklist3,
    },
  };
}
