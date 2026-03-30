import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectStatus } from "@prisma/client";

// Mock project data
const createMockProject = (overrides = {}) => ({
  id: "project-1",
  title: "Test Project",
  description: "A test project description",
  startDate: new Date("2026-01-01"),
  endDate: null,
  status: "ACTIVE" as ProjectStatus,
  ownerId: "owner-1",
  columns: [],
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: {
    tickets: 5,
    members: 3,
  },
  ...overrides,
});

describe("ProjectCard", () => {
  const defaultProps = {
    project: createMockProject(),
    isOwner: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders project title", () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("renders project description", () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText("A test project description")).toBeInTheDocument();
    });

    it("renders project title as a link to project page", () => {
      render(<ProjectCard {...defaultProps} />);

      const titleLink = screen.getByRole("link");
      expect(titleLink).toHaveAttribute("href", "/projects/project-1");
    });

    it("renders ticket count", () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText("5 tickets")).toBeInTheDocument();
    });

    it("renders member count", () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText("3 members")).toBeInTheDocument();
    });

    it("renders active status badge", () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders archived status badge for archived projects", () => {
      const archivedProject = createMockProject({ status: "ARCHIVED" });
      render(<ProjectCard {...defaultProps} project={archivedProject} />);

      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("does not render description when empty", () => {
      const projectWithoutDesc = createMockProject({ description: null });
      render(<ProjectCard {...defaultProps} project={projectWithoutDesc} />);

      expect(screen.queryByText("A test project description")).not.toBeInTheDocument();
    });

    it("truncates long descriptions", () => {
      const longDesc = "A".repeat(300);
      const projectWithLongDesc = createMockProject({ description: longDesc });
      render(<ProjectCard {...defaultProps} project={projectWithLongDesc} />);

      // The description element should have line-clamp-2 class for truncation
      const descElement = screen.getByText(longDesc);
      expect(descElement).toHaveClass("line-clamp-2");
    });
  });

  describe("Owner Actions", () => {
    it("does not render dropdown menu for non-owners", () => {
      render(<ProjectCard {...defaultProps} isOwner={false} />);

      expect(screen.queryByRole("button", { name: /more/i })).not.toBeInTheDocument();
    });

    it("renders dropdown menu for owners", () => {
      render(<ProjectCard {...defaultProps} isOwner={true} />);

      // Find the trigger button with MoreVertical icon
      const menuButton = document.querySelector("button");
      expect(menuButton).toBeInTheDocument();
    });

    it("calls onEdit when edit is clicked", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<ProjectCard {...defaultProps} isOwner={true} onEdit={onEdit} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Click edit option
      const editOption = screen.getByText("Edit");
      await user.click(editOption);

      expect(onEdit).toHaveBeenCalled();
    });

    it("calls onDelete when delete is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<ProjectCard {...defaultProps} isOwner={true} onDelete={onDelete} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Click delete option
      const deleteOption = screen.getByText("Delete");
      await user.click(deleteOption);

      expect(onDelete).toHaveBeenCalled();
    });

    it("calls onArchive when archive is clicked", async () => {
      const user = userEvent.setup();
      const onArchive = vi.fn();
      render(<ProjectCard {...defaultProps} isOwner={true} onArchive={onArchive} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Click archive option
      const archiveOption = screen.getByText("Archive");
      await user.click(archiveOption);

      expect(onArchive).toHaveBeenCalled();
    });

    it("does not show archive option for already archived projects", async () => {
      const user = userEvent.setup();
      const archivedProject = createMockProject({ status: "ARCHIVED" });
      const onArchive = vi.fn();
      render(
        <ProjectCard
          {...defaultProps}
          project={archivedProject}
          isOwner={true}
          onArchive={onArchive}
        />
      );

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Archive option should not be present
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    });

    it("does not show edit option if onEdit is not provided", async () => {
      const user = userEvent.setup();
      render(<ProjectCard {...defaultProps} isOwner={true} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Edit option should not be present
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });

    it("does not show delete option if onDelete is not provided", async () => {
      const user = userEvent.setup();
      render(<ProjectCard {...defaultProps} isOwner={true} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Delete option should not be present
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies hover shadow transition", () => {
      render(<ProjectCard {...defaultProps} />);

      const card = document.querySelector(".hover\\:shadow-lg");
      expect(card).toBeInTheDocument();
    });

    it("applies correct status badge color for active status", () => {
      render(<ProjectCard {...defaultProps} />);

      const badge = screen.getByText("Active").closest('[class*="bg-green"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies correct status badge color for archived status", () => {
      const archivedProject = createMockProject({ status: "ARCHIVED" });
      render(<ProjectCard {...defaultProps} project={archivedProject} />);

      const badge = screen.getByText("Archived").closest('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies destructive style to delete option", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<ProjectCard {...defaultProps} isOwner={true} onDelete={onDelete} />);

      // Click the dropdown trigger
      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      // Check delete option has destructive styling
      const deleteOption = screen.getByText("Delete");
      expect(deleteOption).toHaveClass("text-destructive");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero tickets and members", () => {
      const emptyProject = createMockProject({
        _count: { tickets: 0, members: 0 },
      });
      render(<ProjectCard {...defaultProps} project={emptyProject} />);

      expect(screen.getByText("0 tickets")).toBeInTheDocument();
      expect(screen.getByText("0 members")).toBeInTheDocument();
    });

    it("handles large numbers", () => {
      const largeProject = createMockProject({
        _count: { tickets: 999, members: 100 },
      });
      render(<ProjectCard {...defaultProps} project={largeProject} />);

      expect(screen.getByText("999 tickets")).toBeInTheDocument();
      expect(screen.getByText("100 members")).toBeInTheDocument();
    });
  });
});
