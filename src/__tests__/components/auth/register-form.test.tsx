import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";
import { toast } from "sonner";

// Mock functions
const mockPush = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/register",
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("Rendering", () => {
    it("renders registration form with all elements", () => {
      render(<RegisterForm />);

      expect(screen.getByText("Start organizing")).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("renders name input with correct attributes", () => {
      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute("type", "text");
      expect(nameInput).toHaveAttribute("placeholder", "John Doe");
      expect(nameInput).toBeRequired();
    });

    it("renders email input with correct attributes", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("placeholder", "john@example.com");
      expect(emailInput).toBeRequired();
    });

    it("renders password input with minimum length", () => {
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("minlength", "6");
      expect(passwordInput).toBeRequired();
    });

    it("renders link to login page", () => {
      render(<RegisterForm />);

      const loginLink = screen.getByRole("link", { name: /sign in/i });
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Form Interaction", () => {
    it("allows user to type name", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "John Doe");

      expect(nameInput).toHaveValue("John Doe");
    });

    it("allows user to type email", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "john@example.com");

      expect(emailInput).toHaveValue("john@example.com");
    });

    it("allows user to type password", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("Form Submission - Owner Registration", () => {
    it("submits form with correct data for owner registration", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "1", email: "john@example.com" } }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            role: "OWNER",
          }),
        });
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ user: {} }),
                }),
              100
            )
          )
      );

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      // Check for loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it("redirects to login on successful registration", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "1" } }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("shows success toast on successful registration", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "1" } }),
      });
      const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>;

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Account created! Your second brain is ready."
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast when registration fails", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Email already in use" }),
      });
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Email already in use");
      });
    });

    it("shows error toast on network error", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Something went wrong. Try again?");
      });
    });

    it("does not redirect on failed registration", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Registration failed" }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("re-enables inputs after failed registration", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Registration failed" }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).not.toBeDisabled();
        expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
        expect(screen.getByLabelText(/password/i)).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has properly labeled form fields", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("has accessible submit button", () => {
      render(<RegisterForm />);

      const button = screen.getByRole("button", { name: /create account/i });
      expect(button).toHaveAttribute("type", "submit");
    });

    it("uses semantic form element", () => {
      render(<RegisterForm />);

      expect(document.querySelector("form")).toBeInTheDocument();
    });
  });
});

// Note: Testing invite token flow would require a more complex setup
// with dynamic mock overrides. The Suspense boundary is tested implicitly
// through the main form tests.
