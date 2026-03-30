import { test as base, expect } from "@playwright/test";

/**
 * Test fixtures and helpers for E2E tests
 * Uses the same test data as unit/integration tests
 */

export const TEST_PASSWORD = "password123";

export const TEST_USERS = {
  ALICE: {
    email: "alice@brian.dev",
    name: "Alice Owner",
    password: TEST_PASSWORD,
    role: "OWNER",
  },
  BOB: {
    email: "bob@brian.dev",
    name: "Bob Worker",
    password: TEST_PASSWORD,
    role: "WORKER",
  },
  DIANA: {
    email: "diana@brian.dev",
    name: "Diana Client",
    password: TEST_PASSWORD,
    role: "CLIENT",
  },
} as const;

export const TEST_PROJECTS = {
  ALPHA: {
    title: "Project Alpha",
    description: "Active project with multiple tickets",
  },
  GAMMA: {
    title: "Project Gamma",
    description: "Strict project requiring estimates",
  },
} as const;

// Extended test fixtures with authentication helpers
type TestFixtures = {
  /** Login as a specific user */
  loginAs: (user: keyof typeof TEST_USERS) => Promise<void>;
  /** Login as Alice (owner) - most common case */
  loginAsOwner: () => Promise<void>;
  /** Login as Bob (worker) */
  loginAsWorker: () => Promise<void>;
  /** Login as Diana (client) */
  loginAsClient: () => Promise<void>;
  /** Navigate to a project board */
  goToProject: (projectTitle: string) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  loginAs: async ({ page }, use) => {
    const login = async (userKey: keyof typeof TEST_USERS) => {
      const user = TEST_USERS[userKey];
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password/i).fill(user.password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      // Wait for redirect to dashboard
      await page.waitForURL(/\/(dashboard|projects)/);
    };
    await use(login);
  },

  loginAsOwner: async ({ loginAs }, use) => {
    await use(async () => loginAs("ALICE"));
  },

  loginAsWorker: async ({ loginAs }, use) => {
    await use(async () => loginAs("BOB"));
  },

  loginAsClient: async ({ loginAs }, use) => {
    await use(async () => loginAs("DIANA"));
  },

  goToProject: async ({ page }, use) => {
    const goTo = async (projectTitle: string) => {
      await page.goto("/projects");
      await page.getByRole("link", { name: projectTitle }).click();
      await page.waitForURL(/\/projects\/[^/]+$/);
    };
    await use(goTo);
  },
});

export { expect };

// Common page object patterns
export class AuthPage {
  constructor(private page: import("@playwright/test").Page) {}

  async goto(type: "login" | "register") {
    await this.page.goto(`/${type}`);
  }

  async fillEmail(email: string) {
    await this.page.getByLabel(/email/i).fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/^password$/i).fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.page.getByLabel(/confirm password/i).fill(password);
  }

  async fillName(name: string) {
    await this.page.getByLabel(/name/i).fill(name);
  }

  async submitLogin() {
    await this.page.getByRole("button", { name: /sign in|log in/i }).click();
  }

  async submitRegister() {
    await this.page.getByRole("button", { name: /sign up|register|create account/i }).click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL(/\/(dashboard|projects)/);
  }
}

export class ProjectsPage {
  constructor(private page: import("@playwright/test").Page) {}

  async goto() {
    await this.page.goto("/projects");
  }

  async createProject(title: string, description?: string) {
    await this.page.getByRole("button", { name: /new project/i }).click();
    await this.page.getByLabel(/project name/i).fill(title);
    if (description) {
      await this.page.getByLabel(/description/i).fill(description);
    }
    await this.page.getByRole("button", { name: /create project/i }).click();
  }

  async openProject(title: string) {
    await this.page.getByRole("link", { name: title }).click();
    await this.page.waitForURL(/\/projects\/[^/]+$/);
  }

  async expectProjectVisible(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible();
  }

  async expectProjectNotVisible(title: string) {
    await expect(this.page.getByRole("link", { name: title })).not.toBeVisible();
  }
}

export class BoardPage {
  constructor(private page: import("@playwright/test").Page) {}

  async getColumn(title: string) {
    return this.page.locator('[data-testid="board-column"]').filter({ hasText: title });
  }

  async getTicket(title: string) {
    return this.page.locator('[data-testid="ticket-card"]').filter({ hasText: title });
  }

  async createTicket(title: string, column?: string) {
    if (column) {
      const col = await this.getColumn(column);
      await col.getByRole("button", { name: /add/i }).click();
    } else {
      await this.page
        .getByRole("button", { name: /new ticket|add ticket/i })
        .first()
        .click();
    }
    await this.page.getByLabel(/title/i).fill(title);
    await this.page.getByRole("button", { name: /create/i }).click();
  }

  async openTicket(title: string) {
    const ticket = await this.getTicket(title);
    await ticket.click();
    await this.page.waitForURL(/\/tickets\/[^/]+$/);
  }

  async expectTicketInColumn(ticketTitle: string, columnTitle: string) {
    const column = await this.getColumn(columnTitle);
    await expect(column.getByText(ticketTitle)).toBeVisible();
  }
}

// Data test ID helpers - to be added to components
export const testIds = {
  // Auth
  loginForm: "login-form",
  registerForm: "register-form",

  // Navigation
  navbar: "navbar",
  userMenu: "user-menu",

  // Projects
  projectCard: "project-card",
  createProjectDialog: "create-project-dialog",
  projectList: "project-list",

  // Board
  kanbanBoard: "kanban-board",
  boardColumn: "board-column",
  ticketCard: "ticket-card",

  // Ticket detail
  ticketModal: "ticket-modal",
  ticketTitle: "ticket-title",
  ticketDescription: "ticket-description",

  // Comments
  commentList: "comment-list",
  commentInput: "comment-input",

  // Settings
  projectSettings: "project-settings",
  membersList: "members-list",
};
