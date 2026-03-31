import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { toast } from "sonner";

// Mock functions
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock useRouter
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
  usePathname: () => "/dashboard",
}));

describe("CreateProjectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("Rendering", () => {
    it("renders the trigger button", () => {
      render(<CreateProjectDialog />);

      expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    });

    it("trigger button has plus icon", () => {
      render(<CreateProjectDialog />);

      const button = screen.getByRole("button", { name: /new project/i });
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Dialog Opening", () => {
    it("opens dialog when trigger button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create a Project")).toBeInTheDocument();
    });

    it("shows form fields when dialog is open", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it("shows submit and cancel buttons", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      expect(screen.getByRole("button", { name: /create project/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("allows typing project name", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, "My New Project");

      expect(nameInput).toHaveValue("My New Project");
    });

    it("allows typing description", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "Project description");

      expect(descInput).toHaveValue("Project description");
    });

    it("allows changing start date", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      const dateInput = screen.getByLabelText(/start date/i);
      await user.clear(dateInput);
      await user.type(dateInput, "2026-06-01");

      expect(dateInput).toHaveValue("2026-06-01");
    });

    it("sets default start date to today", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      const dateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;

      // Should have a value (today's date in YYYY-MM-DD format)
      expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("closes dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with correct data", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: "new-project-id" } }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.type(screen.getByLabelText(/description/i), "Test description");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Test Project"),
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
                  json: async () => ({ project: { id: "new-id" } }),
                }),
              100
            )
          )
      );

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      expect(screen.getByText(/creating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i)).toBeDisabled();
    });

    it("redirects to new project page on success", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: "new-project-123" } }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new-project-123");
      });
    });

    it("shows success toast on successful creation", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: "new-id" } }),
      });
      const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>;

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Project created! Your brain is organized.");
      });
    });

    it("closes dialog and resets form on success", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: "new-id" } }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      // Open again and check form is reset
      await user.click(screen.getByRole("button", { name: /new project/i }));
      expect(screen.getByLabelText(/project name/i)).toHaveValue("");
    });

    it("refreshes router on success", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: "new-id" } }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast when API returns error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Project name already exists" }),
      });
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Duplicate Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Project name already exists");
      });
    });

    it("shows generic error toast on network failure", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Network error");
      });
    });

    it("does not close dialog on error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Validation error" }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("re-enables inputs after error", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Validation error" }),
      });

      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));
      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/project name/i)).not.toBeDisabled();
        expect(screen.getByRole("button", { name: /create project/i })).not.toBeDisabled();
      });
    });
  });

  describe("Form Validation", () => {
    it("project name is required", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toHaveAttribute("required");
    });

    it("start date is required", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      const dateInput = screen.getByLabelText(/start date/i);
      expect(dateInput).toHaveAttribute("required");
    });

    it("description is optional", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).not.toHaveAttribute("required");
    });
  });

  describe("Accessibility", () => {
    it("has accessible dialog", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has properly labeled form fields", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog />);

      await user.click(screen.getByRole("button", { name: /new project/i }));

      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });
  });
});
