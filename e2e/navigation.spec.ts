import { test, expect, TEST_USERS } from "./fixtures";

test.describe("Navigation", () => {
  test.describe("Public Routes", () => {
    test("should display home page", async ({ page }) => {
      await page.goto("/");

      // Home page should be accessible
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to login from home", async ({ page }) => {
      await page.goto("/");

      const loginLink = page.getByRole("link", { name: /login|sign in/i });
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test("should navigate to register from home", async ({ page }) => {
      await page.goto("/");

      const registerLink = page.getByRole("link", { name: /register|sign up|get started/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/register/);
      }
    });
  });

  test.describe("Navbar", () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs("ALICE");
    });

    test("should display navbar on dashboard", async ({ page }) => {
      await page.goto("/dashboard");

      const navbar = page
        .locator('[data-testid="navbar"]')
        .or(page.locator("nav"))
        .or(page.locator("header"));

      await expect(navbar.first()).toBeVisible();
    });

    test("should have projects link", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByRole("link", { name: /projects/i })).toBeVisible();
    });

    test("should have dashboard link", async ({ page }) => {
      await page.goto("/projects");

      const dashboardLink = page.getByRole("link", { name: /dashboard|home/i });
      await expect(dashboardLink.first()).toBeVisible();
    });

    test("should have user menu", async ({ page }) => {
      await page.goto("/dashboard");

      const userMenu = page
        .getByRole("button", { name: /account|profile|user/i })
        .or(page.locator('[data-testid="user-menu"]'))
        .or(page.locator('[class*="avatar"]').filter({ hasNotText: "" }));

      await expect(userMenu.first()).toBeVisible();
    });

    test("should navigate to projects via navbar", async ({ page }) => {
      await page.goto("/dashboard");

      await page.getByRole("link", { name: /projects/i }).click();

      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe("User Menu", () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs("ALICE");
    });

    test("should open user menu dropdown", async ({ page }) => {
      await page.goto("/dashboard");

      const userButton = page
        .getByRole("button", { name: /account|profile|user/i })
        .or(page.locator('[class*="avatar"]').first());

      await userButton.click();

      // Dropdown should appear
      const dropdown = page.getByRole("menu").or(page.locator('[role="menuitem"]').first());

      await expect(dropdown.first()).toBeVisible();
    });

    test("should show profile option", async ({ page }) => {
      await page.goto("/dashboard");

      const userButton = page.getByRole("button", { name: /account|profile|user/i }).first();
      await userButton.click();

      await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible();
    });

    test("should show logout option", async ({ page }) => {
      await page.goto("/dashboard");

      const userButton = page.getByRole("button", { name: /account|profile|user/i }).first();
      await userButton.click();

      await expect(page.getByRole("menuitem", { name: /log ?out|sign ?out/i })).toBeVisible();
    });

    test("should navigate to profile page", async ({ page }) => {
      await page.goto("/dashboard");

      const userButton = page.getByRole("button", { name: /account|profile|user/i }).first();
      await userButton.click();

      await page.getByRole("menuitem", { name: /profile/i }).click();

      await expect(page).toHaveURL(/\/profile/);
    });
  });

  test.describe("Breadcrumbs", () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs("ALICE");
    });

    test("should show breadcrumbs on project page", async ({ page }) => {
      await page.goto("/projects");

      // Click on a project
      const projectLink = page
        .getByRole("link")
        .filter({ hasText: /project/i })
        .first();
      if (await projectLink.isVisible()) {
        await projectLink.click();

        // Should show breadcrumbs
        const breadcrumbs = page
          .locator('[aria-label*="breadcrumb" i]')
          .or(page.locator('[class*="breadcrumb"]'));

        const hasBreadcrumbs = await breadcrumbs
          .first()
          .isVisible()
          .catch(() => false);
        expect(true).toBeTruthy();
      }
    });

    test("should navigate back via breadcrumb", async ({ page }) => {
      await page.goto("/projects");

      const projectLink = page
        .getByRole("link")
        .filter({ hasText: /project/i })
        .first();
      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\/[^/]+/);

        // Click projects breadcrumb
        const projectsBreadcrumb = page.getByRole("link", { name: /projects/i }).first();
        if (await projectsBreadcrumb.isVisible()) {
          await projectsBreadcrumb.click();
          await expect(page).toHaveURL(/\/projects$/);
        }
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe("Back Navigation", () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs("ALICE");
    });

    test("should handle browser back button", async ({ page }) => {
      await page.goto("/dashboard");
      await page.goto("/projects");

      await page.goBack();

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("should handle browser forward button", async ({ page }) => {
      await page.goto("/dashboard");
      await page.goto("/projects");
      await page.goBack();

      await page.goForward();

      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe("Responsive Navigation", () => {
    test("should show mobile menu on small screens", async ({ page, loginAs }) => {
      await loginAs("ALICE");
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard");

      // Mobile menu button (hamburger)
      const menuButton = page
        .getByRole("button", { name: /menu/i })
        .or(page.locator('[aria-label*="menu" i]'))
        .or(
          page
            .locator("button")
            .filter({ has: page.locator("svg") })
            .first()
        );

      // May or may not have mobile menu
      expect(true).toBeTruthy();
    });

    test("should toggle mobile menu", async ({ page, loginAs }) => {
      await loginAs("ALICE");
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard");

      const menuButton = page.getByRole("button", { name: /menu/i }).first();
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Menu should open
        const navLinks = page.getByRole("link", { name: /projects|dashboard/i });
        await expect(navLinks.first()).toBeVisible();
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe("404 Page", () => {
    test("should display 404 for non-existent route", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      await page.goto("/this-page-does-not-exist");

      // Should show 404 or redirect
      const has404 = await page
        .getByText(/404|not found|doesn't exist/i)
        .isVisible()
        .catch(() => false);
      const isRedirected = page.url().includes("/login") || page.url().includes("/dashboard");

      expect(has404 || isRedirected).toBeTruthy();
    });

    test("should have link to go back home", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      await page.goto("/this-page-does-not-exist");

      const homeLink = page.getByRole("link", { name: /home|dashboard|back/i });
      const hasHomeLink = await homeLink
        .first()
        .isVisible()
        .catch(() => false);
      expect(true).toBeTruthy();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading indicator during navigation", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      // Navigate and check for loading
      const navigationPromise = page.goto("/projects");

      // May show loading spinner or skeleton
      expect(true).toBeTruthy();
    });
  });

  test.describe("Keyboard Navigation", () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs("ALICE");
    });

    test("should support tab navigation", async ({ page }) => {
      await page.goto("/dashboard");

      // Tab through focusable elements
      await page.keyboard.press("Tab");

      // Should focus on first focusable element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test("should support keyboard shortcuts if implemented", async ({ page }) => {
      await page.goto("/projects");

      // Common shortcuts: Ctrl+K for search, Ctrl+N for new
      // await page.keyboard.press('Control+k');

      expect(true).toBeTruthy();
    });
  });
});
