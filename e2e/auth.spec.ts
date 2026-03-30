import { test, expect, TEST_USERS, AuthPage } from "./fixtures";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
    });

    test("should have link to register page", async ({ page }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("link", { name: /sign up|register|create account/i })
      ).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.goto("login");

      await auth.fillEmail("wrong@email.com");
      await auth.fillPassword("wrongpassword");
      await auth.submitLogin();

      await auth.expectError(/invalid|incorrect|wrong/i);
    });

    test("should show error for empty fields", async ({ page }) => {
      await page.goto("/login");

      // Try to submit without filling fields
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      // Should show validation error (HTML5 validation or custom)
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeFocused();
    });

    test("should login successfully with valid credentials", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.goto("login");

      await auth.fillEmail(TEST_USERS.ALICE.email);
      await auth.fillPassword(TEST_USERS.ALICE.password);
      await auth.submitLogin();

      await auth.expectRedirectToDashboard();
    });

    test("should redirect authenticated user away from login", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      // Try to go to login page
      await page.goto("/login");

      // Should redirect back to dashboard
      await page.waitForURL(/\/(dashboard|projects)/);
    });
  });

  test.describe("Register Page", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign up|register|create account/i })
      ).toBeVisible();
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("link", { name: /sign in|log in|already have/i })).toBeVisible();
    });

    test("should show error for mismatched passwords", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/name/i).fill("Test User");
      await page.getByLabel(/email/i).fill("test@example.com");
      await page.getByLabel(/^password$/i).fill("password123");
      await page.getByLabel(/confirm password/i).fill("different123");
      await page.getByRole("button", { name: /sign up|register|create account/i }).click();

      await expect(page.getByText(/match|same/i)).toBeVisible();
    });

    test("should show error for weak password", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/name/i).fill("Test User");
      await page.getByLabel(/email/i).fill("test@example.com");
      await page.getByLabel(/^password$/i).fill("123");
      await page.getByLabel(/confirm password/i).fill("123");
      await page.getByRole("button", { name: /sign up|register|create account/i }).click();

      await expect(page.getByText(/too short|at least|minimum/i)).toBeVisible();
    });

    test("should show error for invalid email", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/name/i).fill("Test User");
      await page.getByLabel(/email/i).fill("invalid-email");
      await page.getByLabel(/^password$/i).fill("password123");
      await page.getByLabel(/confirm password/i).fill("password123");
      await page.getByRole("button", { name: /sign up|register|create account/i }).click();

      // Either HTML5 validation or custom error
      const emailInput = page.getByLabel(/email/i);
      const isFocused = await emailInput.evaluate((el) => el === document.activeElement);
      const hasError = await page
        .getByText(/invalid|valid email/i)
        .isVisible()
        .catch(() => false);
      expect(isFocused || hasError).toBeTruthy();
    });

    test("should show error for existing email", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/name/i).fill("Alice Clone");
      await page.getByLabel(/email/i).fill(TEST_USERS.ALICE.email);
      await page.getByLabel(/^password$/i).fill("password123");
      await page.getByLabel(/confirm password/i).fill("password123");
      await page.getByRole("button", { name: /sign up|register|create account/i }).click();

      await expect(page.getByText(/already exists|taken|in use/i)).toBeVisible();
    });

    test("should register successfully with valid data", async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto("/register");

      await page.getByLabel(/name/i).fill("New Test User");
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/^password$/i).fill("password123");
      await page.getByLabel(/confirm password/i).fill("password123");
      await page.getByRole("button", { name: /sign up|register|create account/i }).click();

      // Should redirect to dashboard or show success
      await page.waitForURL(/\/(dashboard|projects|login)/);
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      // Open user menu and click logout
      await page.getByRole("button", { name: /account|profile|user/i }).click();
      await page.getByRole("menuitem", { name: /log ?out|sign ?out/i }).click();

      // Should redirect to login
      await page.waitForURL(/\/login/);
    });

    test("should clear session after logout", async ({ page, loginAs }) => {
      await loginAs("ALICE");
      await page.goto("/projects");

      // Logout
      await page.getByRole("button", { name: /account|profile|user/i }).click();
      await page.getByRole("menuitem", { name: /log ?out|sign ?out/i }).click();
      await page.waitForURL(/\/login/);

      // Try to access protected page
      await page.goto("/projects");

      // Should redirect to login
      await page.waitForURL(/\/login/);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated user from dashboard to login", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForURL(/\/login/);
    });

    test("should redirect unauthenticated user from projects to login", async ({ page }) => {
      await page.goto("/projects");
      await page.waitForURL(/\/login/);
    });

    test("should redirect unauthenticated user from project detail to login", async ({ page }) => {
      await page.goto("/projects/some-id");
      await page.waitForURL(/\/login/);
    });

    test("should allow authenticated user to access dashboard", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      await page.goto("/dashboard");

      // Should stay on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("should allow authenticated user to access projects", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      await page.goto("/projects");

      // Should stay on projects
      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe("Session Persistence", () => {
    test("should maintain session across page reloads", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      // Reload the page
      await page.reload();

      // Should still be on protected page
      await expect(page).not.toHaveURL(/\/login/);
    });

    test("should maintain session across navigation", async ({ page, loginAs }) => {
      await loginAs("ALICE");

      // Navigate around
      await page.goto("/projects");
      await page.goto("/dashboard");
      await page.goto("/projects");

      // Should still be authenticated
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
