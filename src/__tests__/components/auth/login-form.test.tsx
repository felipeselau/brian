import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

// Get mocked functions
const mockSignIn = signIn as ReturnType<typeof vi.fn>;
const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock useRouter with controlled functions
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockReset();
  });

  describe("Rendering", () => {
    it("renders login form with all elements", () => {
      render(<LoginForm />);

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByText(/Your second brain is ready/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders email input with correct attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("placeholder", "john@example.com");
      expect(emailInput).toBeRequired();
    });

    it("renders password input with correct attributes", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toBeRequired();
    });

    it("renders link to registration page", () => {
      render(<LoginForm />);

      const registerLink = screen.getByRole("link", { name: /start organizing/i });
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("displays info about workers and clients receiving invite links", () => {
      render(<LoginForm />);

      expect(screen.getByText(/Workers and clients receive an invite link/i)).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("allows user to type email", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    it("allows user to type password", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("Form Submission", () => {
    it("calls signIn with credentials on form submission", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "password123",
          redirect: false,
        });
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      // Make signIn take time to resolve
      mockSignIn.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Check for loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it("redirects to dashboard on successful login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows success toast on successful login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: null });
      const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>;

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Welcome back! Your second brain is ready.");
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast on invalid credentials", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: "Invalid credentials" });
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Invalid email or password");
      });
    });

    it("shows error toast on network error", async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error("Network error"));
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Something went wrong. Try again?");
      });
    });

    it("does not redirect on failed login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: "Invalid credentials" });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("re-enables inputs after failed login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: "Invalid credentials" });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
        expect(screen.getByLabelText(/password/i)).not.toBeDisabled();
        expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has properly labeled form fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("has accessible submit button", () => {
      render(<LoginForm />);

      const button = screen.getByRole("button", { name: /sign in/i });
      expect(button).toHaveAttribute("type", "submit");
    });

    it("uses semantic form element", () => {
      render(<LoginForm />);

      expect(document.querySelector("form")).toBeInTheDocument();
    });
  });
});
