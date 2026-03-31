import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting test database seed...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("👥 Creating users...");
  const alice = await prisma.user.upsert({
    where: { email: "alice@brian.dev" },
    update: {},
    create: {
      email: "alice@brian.dev",
      name: "Alice Owner",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@brian.dev" },
    update: {},
    create: {
      email: "bob@brian.dev",
      name: "Bob Worker",
      password: hashedPassword,
      role: "WORKER",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@brian.dev" },
    update: {},
    create: {
      email: "charlie@brian.dev",
      name: "Charlie Worker",
      password: hashedPassword,
      role: "WORKER",
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: "diana@brian.dev" },
    update: {},
    create: {
      email: "diana@brian.dev",
      name: "Diana Client",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@brian.dev" },
    update: {},
    create: {
      email: "eve@brian.dev",
      name: "Eve Client",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const frank = await prisma.user.upsert({
    where: { email: "frank@brian.dev" },
    update: {},
    create: {
      email: "frank@brian.dev",
      name: "Frank Owner",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  console.log("📁 Creating projects...");
  const projectAlpha = await prisma.project.upsert({
    where: { id: "project-alpha" },
    update: {},
    create: {
      id: "project-alpha",
      title: "Project Alpha",
      description: "Active project with multiple tickets and team members",
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

  const projectBeta = await prisma.project.upsert({
    where: { id: "project-beta" },
    update: {},
    create: {
      id: "project-beta",
      title: "Project Beta",
      description: "Archived project from last year",
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

  const projectGamma = await prisma.project.upsert({
    where: { id: "project-gamma" },
    update: {},
    create: {
      id: "project-gamma",
      title: "Project Gamma",
      description: "Strict project requiring estimates before work starts",
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

  console.log("👥 Adding project members...");
  await prisma.projectMember.deleteMany({});
  await prisma.projectMember.createMany({
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

  console.log("🏷️  Creating labels...");
  const bugLabel = await prisma.label.create({
    data: {
      name: "Bug",
      color: "#ef4444",
      projectId: projectAlpha.id,
    },
  });

  const featureLabel = await prisma.label.create({
    data: {
      name: "Feature",
      color: "#3b82f6",
      projectId: projectAlpha.id,
    },
  });

  const urgentLabel = await prisma.label.create({
    data: {
      name: "Urgent",
      color: "#f59e0b",
      projectId: projectAlpha.id,
    },
  });

  console.log("🎫 Creating tickets...");
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: "Setup authentication system",
        description: "Implement NextAuth with credentials provider and secure session management",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Design project board UI",
        description: "Create responsive Kanban board with drag and drop functionality",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Fix login bug on mobile Safari",
        description: "Users cannot login on iOS Safari - investigating session storage issues",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Add export to CSV feature",
        description: "Allow users to export project data and time logs to CSV format",
        status: "BACKLOG",
        projectId: projectAlpha.id,
        createdById: diana.id,
        isClientRequest: true,
        position: 0,
        approvals: {},
        lifecycleLog: [],
      },
    }),

    prisma.ticket.create({
      data: {
        title: "Database optimization and indexing",
        description: "Add database indexes and optimize slow queries for better performance",
        status: "BACKLOG",
        projectId: projectAlpha.id,
        createdById: alice.id,
        estimatedHours: 12,
        position: 1,
        approvals: {},
        lifecycleLog: [],
      },
    }),

    prisma.ticket.create({
      data: {
        title: "Blocked: Waiting for third-party API",
        description: "Cannot proceed until external payment API is ready for integration",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Waiting for client design approval",
        description: "Design mockups sent to client, awaiting feedback and approval",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Implement notification system",
        description: "Email and in-app notifications for project updates",
        status: "BACKLOG",
        projectId: projectGamma.id,
        createdById: frank.id,
        estimatedHours: 20,
        position: 0,
        approvals: {},
        lifecycleLog: [],
      },
    }),

    prisma.ticket.create({
      data: {
        title: "Setup CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Write comprehensive API documentation",
        description: "Complete OpenAPI specification for all REST endpoints",
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
    }),

    prisma.ticket.create({
      data: {
        title: "URGENT: Critical client feature request",
        description: "High priority feature needed for upcoming product launch",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Legacy feature migration",
        description: "Migrated old feature to new architecture - archived after completion",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Performance testing and load optimization",
        description: "Conduct load testing and optimize application performance",
        status: "BACKLOG",
        projectId: projectAlpha.id,
        createdById: alice.id,
        position: 2,
        approvals: {},
        lifecycleLog: [],
      },
    }),

    prisma.ticket.create({
      data: {
        title: "Security audit and penetration testing",
        description: "Complete security review and fix identified vulnerabilities",
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
    }),

    prisma.ticket.create({
      data: {
        title: "Codebase refactoring and cleanup",
        description: "Remove legacy code and improve overall code structure",
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
    }),
  ]);

  console.log("🏷️  Assigning labels to tickets...");
  await prisma.ticketLabel.createMany({
    data: [
      { ticketId: tickets[2].id, labelId: bugLabel.id },
      { ticketId: tickets[2].id, labelId: urgentLabel.id },
      { ticketId: tickets[3].id, labelId: featureLabel.id },
      { ticketId: tickets[7].id, labelId: featureLabel.id },
      { ticketId: tickets[10].id, labelId: urgentLabel.id },
    ],
  });

  console.log("💬 Creating comments...");
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: "Great work on this authentication system! 🎉",
        ticketId: tickets[0].id,
        userId: alice.id,
        mentions: [bob.id],
      },
    }),

    prisma.comment.create({
      data: {
        content: "Found a small issue with the mobile layout responsiveness",
        ticketId: tickets[1].id,
        userId: diana.id,
        mentions: [charlie.id],
      },
    }),

    prisma.comment.create({
      data: {
        content: "Testing looks good, ready for production deployment",
        ticketId: tickets[2].id,
        userId: bob.id,
      },
    }),

    prisma.comment.create({
      data: {
        content: "We need this feature ASAP for the upcoming product launch next week",
        ticketId: tickets[10].id,
        userId: eve.id,
        mentions: [bob.id, frank.id],
      },
    }),
  ]);

  console.log("👍 Adding reactions to comments...");
  await prisma.reaction.createMany({
    data: [
      { commentId: comments[0].id, userId: bob.id, emoji: "👍" },
      { commentId: comments[0].id, userId: charlie.id, emoji: "🎉" },
      { commentId: comments[1].id, userId: charlie.id, emoji: "👀" },
      { commentId: comments[3].id, userId: frank.id, emoji: "🚀" },
    ],
  });

  console.log("📎 Adding attachments...");
  await prisma.attachment.createMany({
    data: [
      {
        ticketId: tickets[1].id,
        name: "mockup-v1.png",
        url: "https://mock-r2.cloudflare.com/uploads/mockup-v1.png",
        size: 245600,
        type: "image/png",
      },
      {
        ticketId: tickets[1].id,
        name: "design-specs.pdf",
        url: "https://mock-r2.cloudflare.com/uploads/design-specs.pdf",
        size: 1048576,
        type: "application/pdf",
      },
      {
        ticketId: tickets[2].id,
        name: "screenshot-bug.jpg",
        url: "https://mock-r2.cloudflare.com/uploads/screenshot-bug.jpg",
        size: 189440,
        type: "image/jpeg",
      },
      {
        ticketId: tickets[13].id,
        name: "security-report.pdf",
        url: "https://mock-r2.cloudflare.com/uploads/security-report.pdf",
        size: 2097152,
        type: "application/pdf",
      },
    ],
  });

  console.log("✅ Creating checklists...");
  const checklists = await Promise.all([
    prisma.checklist.create({
      data: {
        title: "Authentication Implementation Tasks",
        ticketId: tickets[0].id,
        position: 0,
      },
    }),

    prisma.checklist.create({
      data: {
        title: "Design Checklist",
        ticketId: tickets[1].id,
        position: 0,
      },
    }),

    prisma.checklist.create({
      data: {
        title: "Security Audit Checklist",
        ticketId: tickets[13].id,
        position: 0,
      },
    }),
  ]);

  console.log("✅ Adding checklist items...");
  await prisma.checklistItem.createMany({
    data: [
      {
        checklistId: checklists[0].id,
        content: "Setup NextAuth configuration",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklists[0].id,
        content: "Create login page UI",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklists[0].id,
        content: "Create registration page",
        completed: true,
        position: 2,
      },
      {
        checklistId: checklists[0].id,
        content: "Test authentication flow end-to-end",
        completed: true,
        position: 3,
      },

      {
        checklistId: checklists[1].id,
        content: "Create low-fidelity wireframes",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklists[1].id,
        content: "Design high-fidelity mockups in Figma",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklists[1].id,
        content: "Implement drag and drop functionality",
        completed: false,
        position: 2,
      },
      {
        checklistId: checklists[1].id,
        content: "Add smooth animations and transitions",
        completed: false,
        position: 3,
      },
      {
        checklistId: checklists[1].id,
        content: "Test responsiveness on mobile devices",
        completed: false,
        position: 4,
      },

      {
        checklistId: checklists[2].id,
        content: "SQL injection vulnerability testing",
        completed: true,
        position: 0,
      },
      {
        checklistId: checklists[2].id,
        content: "XSS (Cross-Site Scripting) check",
        completed: true,
        position: 1,
      },
      {
        checklistId: checklists[2].id,
        content: "CSRF protection verification",
        completed: true,
        position: 2,
      },
      {
        checklistId: checklists[2].id,
        content: "Authentication bypass attempt testing",
        completed: true,
        position: 3,
      },
      {
        checklistId: checklists[2].id,
        content: "Rate limiting and DDoS protection check",
        completed: false,
        position: 4,
      },
    ],
  });

  console.log("✉️  Creating project invites...");
  await prisma.invite.createMany({
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

  console.log("✅ Test database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - 6 users created (Alice, Bob, Charlie, Diana, Eve, Frank)`);
  console.log(`   - 3 projects created (Alpha active, Beta archived, Gamma strict)`);
  console.log(`   - 15 tickets with various statuses`);
  console.log(`   - 3 labels (Bug, Feature, Urgent)`);
  console.log(`   - 4 comments with reactions`);
  console.log(`   - 4 attachments`);
  console.log(`   - 3 checklists with 14 items`);
  console.log(`   - 3 project invites`);
  console.log("\n🔐 Login credentials:");
  console.log("   Email: alice@brian.dev (OWNER)");
  console.log("   Email: bob@brian.dev (WORKER)");
  console.log("   Email: charlie@brian.dev (WORKER)");
  console.log("   Email: diana@brian.dev (CLIENT)");
  console.log("   Email: eve@brian.dev (CLIENT)");
  console.log("   Email: frank@brian.dev (OWNER)");
  console.log("   Password: password123\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
