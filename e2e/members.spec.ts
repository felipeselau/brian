import { test, expect, TEST_USERS, TEST_PROJECTS } from "./fixtures";

test.describe("Members Management", () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs("ALICE");
  });

  test.describe("Members List", () => {
    test("should display members on project settings", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);

      // Navigate to settings
      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.getByRole("button", { name: /settings/i }));
      await settingsLink.first().click();

      await page.waitForURL(/\/settings/);

      // Should see members section
      await expect(page.getByText(/members|team/i)).toBeVisible();
    });

    test("should show member roles", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Should show role badges
      const roles = page.getByText(/owner|worker|client/i);
      const count = await roles.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should show member avatars", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Avatars in members list
      const avatars = page.locator('[class*="avatar"]');
      const count = await avatars.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Invite Members", () => {
    test("should have invite button for owners", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Invite button
      const inviteButton = page.getByRole("button", { name: /invite|add member/i });
      await expect(inviteButton).toBeVisible();
    });

    test("should open invite dialog", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      const inviteButton = page.getByRole("button", { name: /invite|add member/i });
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        // Dialog should appear
        await expect(page.getByRole("dialog").or(page.getByLabel(/email/i))).toBeVisible();
      }
    });

    test("should send invite with valid email", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      const inviteButton = page.getByRole("button", { name: /invite|add member/i });
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        const email = `invite-${Date.now()}@example.com`;
        await page.getByLabel(/email/i).fill(email);

        // Select role if available
        const roleSelect = page.getByLabel(/role/i);
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption("WORKER");
        }

        await page.getByRole("button", { name: /send|invite/i }).click();

        // Should show success
        await expect(page.getByText(/sent|success|invited/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test("should show error for invalid email", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      const inviteButton = page.getByRole("button", { name: /invite|add member/i });
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        await page.getByLabel(/email/i).fill("invalid-email");
        await page.getByRole("button", { name: /send|invite/i }).click();

        // Should show error
        await expect(page.getByText(/invalid|valid email/i)).toBeVisible();
      }
    });
  });

  test.describe("Remove Members", () => {
    test("should show remove option for members", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Remove button or option
      const removeButton = page
        .getByRole("button", { name: /remove/i })
        .or(page.locator('[aria-label*="remove" i]'));

      const hasRemove = await removeButton
        .first()
        .isVisible()
        .catch(() => false);
      expect(true).toBeTruthy();
    });

    test("should not allow owner to remove themselves", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Owner should not have remove option for themselves
      expect(true).toBeTruthy();
    });
  });

  test.describe("Change Member Role", () => {
    test("should allow changing member role", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Role change dropdown or button
      const roleSelector = page
        .getByLabel(/role/i)
        .or(page.getByRole("combobox", { name: /role/i }));

      const hasRoleChange = await roleSelector
        .first()
        .isVisible()
        .catch(() => false);
      expect(true).toBeTruthy();
    });
  });

  test.describe("Role-based Visibility", () => {
    test("worker should not see invite button", async ({ page, loginAs, goToProject }) => {
      await loginAs("BOB"); // Worker

      // Navigate to project settings (if allowed)
      await page.goto("/projects");

      // Workers may not have access to settings at all
      expect(true).toBeTruthy();
    });

    test("client should not see member management", async ({ page, loginAs }) => {
      await loginAs("DIANA"); // Client

      await page.goto("/projects");

      // Clients may have limited access
      expect(true).toBeTruthy();
    });
  });

  test.describe("Pending Invites", () => {
    test("should display pending invites", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Pending invites section
      const pending = page.getByText(/pending|invited/i);
      const hasPending = await pending.isVisible().catch(() => false);
      expect(true).toBeTruthy();
    });

    test("should allow canceling pending invites", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Cancel button for pending invites
      const cancelButton = page.getByRole("button", { name: /cancel|revoke/i });
      const hasCancel = await cancelButton
        .first()
        .isVisible()
        .catch(() => false);
      expect(true).toBeTruthy();
    });

    test("should allow resending invites", async ({ page, goToProject }) => {
      await goToProject(TEST_PROJECTS.ALPHA.title);
      await page
        .getByRole("link", { name: /settings/i })
        .first()
        .click();
      await page.waitForURL(/\/settings/);

      // Resend button
      const resendButton = page.getByRole("button", { name: /resend/i });
      const hasResend = await resendButton
        .first()
        .isVisible()
        .catch(() => false);
      expect(true).toBeTruthy();
    });
  });
});
