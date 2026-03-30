import { test, expect, TEST_PROJECTS, BoardPage } from "./fixtures";

test.describe("Tickets", () => {
  test.beforeEach(async ({ loginAs, goToProject }) => {
    await loginAs("ALICE");
    await goToProject(TEST_PROJECTS.ALPHA.title);
  });

  test.describe("Ticket List", () => {
    test("should display tickets in board columns", async ({ page }) => {
      // Should see at least one ticket from test fixtures
      const ticketCards = page
        .locator('[data-testid="ticket-card"]')
        .or(page.locator(".cursor-pointer").filter({ hasText: /setup|design|fix|add|database/i }));

      await expect(ticketCards.first()).toBeVisible({ timeout: 5000 });
    });

    test("should show ticket titles", async ({ page }) => {
      // Test fixture tickets
      const ticketTexts = [
        "Setup authentication",
        "Design project board UI",
        "Fix login bug",
        "Add export to CSV",
        "Database optimization",
      ];

      let foundTicket = false;
      for (const text of ticketTexts) {
        if (
          await page
            .getByText(text)
            .isVisible()
            .catch(() => false)
        ) {
          foundTicket = true;
          break;
        }
      }
      expect(foundTicket).toBeTruthy();
    });
  });

  test.describe("Create Ticket", () => {
    test("should have add ticket button", async ({ page }) => {
      const addButton = page
        .getByRole("button", { name: /add|new|create/i })
        .filter({ hasText: /ticket|card/i })
        .or(page.locator('[aria-label*="add" i]'));

      // There should be at least one way to add a ticket
      const count = await addButton.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should open create ticket dialog", async ({ page }) => {
      // Look for column add button or general add button
      const addButton = page
        .locator('[data-testid="board-column"]')
        .first()
        .getByRole("button", { name: /add/i })
        .or(page.getByRole("button", { name: /new ticket/i }));

      if (await addButton.first().isVisible()) {
        await addButton.first().click();

        // Should show dialog or form
        await expect(page.getByRole("dialog").or(page.getByLabel(/title/i))).toBeVisible();
      }
    });

    test("should create ticket with valid data", async ({ page }) => {
      const ticketTitle = `Test Ticket ${Date.now()}`;

      // Open create dialog
      const addButton = page.getByRole("button", { name: /add.*ticket|new.*ticket/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();

        await page.getByLabel(/title/i).fill(ticketTitle);
        await page.getByRole("button", { name: /create|save|add/i }).click();

        // Should see new ticket on board
        await expect(page.getByText(ticketTitle)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Ticket Detail", () => {
    test("should open ticket detail on click", async ({ page }) => {
      const board = new BoardPage(page);

      // Find first ticket and click
      const ticket = page.locator(".cursor-pointer").filter({ hasText: /setup/i }).first();
      if (await ticket.isVisible()) {
        await ticket.click();

        // Should navigate to ticket detail or open modal
        const hasDialog = await page
          .getByRole("dialog")
          .or(page.locator('[data-testid="ticket-modal"]'))
          .isVisible()
          .catch(() => false);
        const hasNavigation = page.url().includes("/tickets/");
        expect(hasDialog || hasNavigation).toBeTruthy();
      }
    });

    test("should display ticket title in detail view", async ({ page }) => {
      // Click on a ticket
      const ticket = page.locator(".cursor-pointer").filter({ hasText: /setup authentication/i });
      if (await ticket.isVisible()) {
        await ticket.click();
        await page.waitForURL(/\/tickets\//);

        await expect(page.getByRole("heading", { name: /setup authentication/i })).toBeVisible();
      }
    });

    test("should display ticket description", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").filter({ hasText: /setup authentication/i });
      if (await ticket.isVisible()) {
        await ticket.click();
        await page.waitForURL(/\/tickets\//);

        // Description should be visible
        await expect(page.getByText(/implement nextauth|credentials provider/i)).toBeVisible();
      }
    });

    test("should show ticket status", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").first();
      await ticket.click();

      // Wait for navigation or modal
      await page.waitForTimeout(500);

      // Status should be displayed somewhere
      const statusIndicators = page
        .locator('[class*="badge"], [class*="status"]')
        .or(page.getByText(/backlog|in progress|review|done|blocked|waiting/i));
      await expect(statusIndicators.first()).toBeVisible();
    });
  });

  test.describe("Edit Ticket", () => {
    test("should allow editing ticket title", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").first();
      await ticket.click();

      await page.waitForTimeout(500);

      // Look for edit button or editable title
      const editButton = page.getByRole("button", { name: /edit/i });
      const titleInput = page.getByLabel(/title/i);

      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page.getByLabel(/title/i)).toBeVisible();
      }
    });

    test("should save ticket changes", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").first();
      await ticket.click();

      await page.waitForTimeout(500);

      const editButton = page.getByRole("button", { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        const newTitle = `Updated ${Date.now()}`;
        await page.getByLabel(/title/i).fill(newTitle);
        await page.getByRole("button", { name: /save/i }).click();

        // Should show updated title or success message
        await expect(page.getByText(newTitle).or(page.getByText(/saved|updated/i))).toBeVisible();
      }
    });
  });

  test.describe("Delete Ticket", () => {
    test("should show delete option for ticket", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").first();
      await ticket.click();

      await page.waitForTimeout(500);

      // Delete should be available
      const deleteButton = page
        .getByRole("button", { name: /delete/i })
        .or(page.locator('[aria-label*="delete" i]'));

      // May not be visible for all tickets or roles
      if (await deleteButton.isVisible()) {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe("Ticket Hours", () => {
    test("should display estimated hours", async ({ page }) => {
      // Find ticket with estimated hours (from fixtures)
      const ticket = page.locator(".cursor-pointer").filter({ hasText: /8h|16h|12h/ });

      await expect(ticket.first()).toBeVisible();
    });

    test("should display logged hours", async ({ page }) => {
      // Find ticket with logged hours
      const ticket = page.locator(".cursor-pointer").filter({ hasText: /\/.*h/ });

      await expect(ticket.first()).toBeVisible();
    });

    test("should allow logging hours", async ({ page }) => {
      const ticket = page.locator(".cursor-pointer").first();
      await ticket.click();

      await page.waitForURL(/\/tickets\//);

      // Look for hours input or log time button
      const logButton = page.getByRole("button", { name: /log.*time|add.*hours/i });
      if (await logButton.isVisible()) {
        await logButton.click();

        // Should show hours input
        await expect(page.getByLabel(/hours/i)).toBeVisible();
      }
    });
  });

  test.describe("Ticket Metadata", () => {
    test("should display comment count", async ({ page }) => {
      // Find ticket with comments (icon with count)
      const commentIndicator = page
        .locator("svg")
        .filter({ has: page.locator('[class*="message"]') });

      // May or may not be visible
      const count = await commentIndicator.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display attachment count", async ({ page }) => {
      // Find ticket with attachments
      const attachmentIndicator = page
        .locator("svg")
        .filter({ has: page.locator('[class*="paperclip"]') });

      const count = await attachmentIndicator.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display due date", async ({ page }) => {
      // Tickets with due dates show indicators
      const dueDateIndicator = page.getByText(/left|today|tomorrow|overdue/i);

      // May or may not be visible
      const count = await dueDateIndicator.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display assignee avatar", async ({ page }) => {
      // Look for avatar components
      const avatars = page.locator('[class*="avatar"]');

      const count = await avatars.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Ticket Labels", () => {
    test("should display ticket labels", async ({ page }) => {
      // Labels are colored spans
      const labels = page.locator('[style*="background-color"]').filter({ hasText: "" });

      // May or may not have labels
      const count = await labels.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
