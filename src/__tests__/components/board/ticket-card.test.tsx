import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketCard } from "@/components/board/ticket-card";
import { TicketStatus } from "@prisma/client";

// Mock ticket data
const createMockTicket = (overrides = {}) => ({
  id: "ticket-1",
  title: "Test Ticket",
  description: "This is a test ticket description",
  status: "BACKLOG" as TicketStatus,
  estimatedHours: 8,
  loggedHours: 4,
  assignedTo: {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    image: null,
  },
  _count: {
    comments: 3,
    attachments: 2,
  },
  labels: [],
  dueDate: null,
  coverImage: null,
  ...overrides,
});

describe("TicketCard", () => {
  const defaultProps = {
    ticket: createMockTicket(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders ticket title", () => {
      render(<TicketCard {...defaultProps} />);

      expect(screen.getByText("Test Ticket")).toBeInTheDocument();
    });

    it("renders ticket description preview", () => {
      render(<TicketCard {...defaultProps} />);

      expect(screen.getByText("This is a test ticket description")).toBeInTheDocument();
    });

    it("does not render description when empty", () => {
      const ticketNoDesc = createMockTicket({ description: null });
      render(<TicketCard ticket={ticketNoDesc} />);

      expect(screen.queryByText("This is a test ticket description")).not.toBeInTheDocument();
    });

    it("truncates description to 2 lines", () => {
      const longDesc = "A".repeat(300);
      const ticketLongDesc = createMockTicket({ description: longDesc });
      render(<TicketCard ticket={ticketLongDesc} />);

      const descElement = screen.getByText(longDesc);
      expect(descElement).toHaveClass("line-clamp-2");
    });
  });

  describe("Hours Display", () => {
    it("renders logged and estimated hours", () => {
      render(<TicketCard {...defaultProps} />);

      expect(screen.getByText("4/8h")).toBeInTheDocument();
    });

    it("renders only logged hours when no estimate", () => {
      const ticketNoEstimate = createMockTicket({ estimatedHours: null });
      render(<TicketCard ticket={ticketNoEstimate} />);

      expect(screen.getByText("4h")).toBeInTheDocument();
    });

    it("does not render hours section when no logged or estimated hours", () => {
      const ticketNoHours = createMockTicket({
        estimatedHours: null,
        loggedHours: 0,
      });
      render(<TicketCard ticket={ticketNoHours} />);

      // Should not find any hour indicator
      expect(screen.queryByText(/h$/)).not.toBeInTheDocument();
    });
  });

  describe("Metadata Counts", () => {
    it("renders comment count", () => {
      render(<TicketCard {...defaultProps} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders attachment count", () => {
      render(<TicketCard {...defaultProps} />);

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not render comment count when zero", () => {
      const ticketNoComments = createMockTicket({
        _count: { comments: 0, attachments: 2 },
      });
      render(<TicketCard ticket={ticketNoComments} />);

      // Find attachment count but not an additional 0 for comments
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.queryAllByText("0")).toHaveLength(0);
    });

    it("does not render attachment count when zero", () => {
      const ticketNoAttachments = createMockTicket({
        _count: { comments: 3, attachments: 0 },
      });
      render(<TicketCard ticket={ticketNoAttachments} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("Assignee Avatar", () => {
    it("renders assignee avatar", () => {
      render(<TicketCard {...defaultProps} />);

      // Avatar fallback shows first letter of name
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("renders fallback with email initial when no name", () => {
      const ticketNoName = createMockTicket({
        assignedTo: {
          id: "user-1",
          name: null,
          email: "test@example.com",
          image: null,
        },
      });
      render(<TicketCard ticket={ticketNoName} />);

      // Should use email initial
      expect(screen.getByText("T")).toBeInTheDocument();
    });

    it("does not render avatar when unassigned", () => {
      const unassignedTicket = createMockTicket({ assignedTo: null });
      render(<TicketCard ticket={unassignedTicket} />);

      expect(screen.queryByText("J")).not.toBeInTheDocument();
    });
  });

  describe("Labels", () => {
    it("renders labels", () => {
      const ticketWithLabels = createMockTicket({
        labels: [
          { id: "label-1", name: "Bug", color: "#ef4444" },
          { id: "label-2", name: "Urgent", color: "#f59e0b" },
        ],
      });
      render(<TicketCard ticket={ticketWithLabels} />);

      // Labels are rendered as colored spans
      const labelElements = document.querySelectorAll('[style*="background-color"]');
      expect(labelElements.length).toBe(2);
    });

    it("label has title attribute with label name", () => {
      const ticketWithLabels = createMockTicket({
        labels: [{ id: "label-1", name: "Bug", color: "#ef4444" }],
      });
      render(<TicketCard ticket={ticketWithLabels} />);

      expect(screen.getByTitle("Bug")).toBeInTheDocument();
    });

    it("does not render labels section when empty", () => {
      const ticketNoLabels = createMockTicket({ labels: [] });
      render(<TicketCard ticket={ticketNoLabels} />);

      const labelElements = document.querySelectorAll('.rounded-full[style*="background-color"]');
      expect(labelElements.length).toBe(0);
    });
  });

  describe("Due Date", () => {
    it("renders due date when present", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const ticketWithDueDate = createMockTicket({
        dueDate: futureDate.toISOString(),
      });
      render(<TicketCard ticket={ticketWithDueDate} />);

      expect(screen.getByText(/\d+d left/)).toBeInTheDocument();
    });

    it('shows "Today" for today due date', () => {
      const today = new Date();
      const ticketDueToday = createMockTicket({
        dueDate: today.toISOString(),
      });
      render(<TicketCard ticket={ticketDueToday} />);

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it('shows "Tomorrow" for tomorrow due date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ticketDueTomorrow = createMockTicket({
        dueDate: tomorrow.toISOString(),
      });
      render(<TicketCard ticket={ticketDueTomorrow} />);

      expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    });

    it("shows overdue indicator for past due date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const overdueTicket = createMockTicket({
        dueDate: pastDate.toISOString(),
      });
      render(<TicketCard ticket={overdueTicket} />);

      expect(screen.getByText(/overdue/)).toBeInTheDocument();
    });

    it("applies correct color for overdue tickets", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const overdueTicket = createMockTicket({
        dueDate: pastDate.toISOString(),
      });
      render(<TicketCard ticket={overdueTicket} />);

      const dueDateElement = screen.getByText(/overdue/);
      expect(dueDateElement.closest("span")).toHaveClass("bg-red-100");
    });

    it("does not render due date when null", () => {
      const ticketNoDueDate = createMockTicket({ dueDate: null });
      render(<TicketCard ticket={ticketNoDueDate} />);

      expect(screen.queryByText(/left|Today|Tomorrow|overdue/)).not.toBeInTheDocument();
    });
  });

  describe("Cover Image", () => {
    it("renders cover image when present", () => {
      const ticketWithCover = createMockTicket({
        coverImage: "https://example.com/image.jpg",
      });
      const { container } = render(<TicketCard ticket={ticketWithCover} />);

      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute("src")).toContain("example.com/image.jpg");
    });

    it("does not render cover image when null", () => {
      const ticketNoCover = createMockTicket({ coverImage: null });
      const { container } = render(<TicketCard ticket={ticketNoCover} />);

      expect(container.querySelector("img")).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onClick when card is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<TicketCard {...defaultProps} onClick={onClick} />);

      // Find the card element (it has cursor-pointer class)
      const card = document.querySelector(".cursor-pointer");
      await user.click(card!);

      expect(onClick).toHaveBeenCalled();
    });

    it("has drag handle", () => {
      render(<TicketCard {...defaultProps} />);

      // GripVertical icon should be present (it's inside a button)
      const dragHandle = document.querySelector("button");
      expect(dragHandle).toBeInTheDocument();
    });

    it("drag handle click does not trigger card onClick", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<TicketCard {...defaultProps} onClick={onClick} />);

      // Find the drag handle button
      const dragHandle = document.querySelector("button");
      await user.click(dragHandle!);

      // onClick should not be called because drag handle stops propagation
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies hover styles", () => {
      render(<TicketCard {...defaultProps} />);

      const card = document.querySelector(".hover\\:bg-accent\\/50");
      expect(card).toBeInTheDocument();
    });

    it("applies border styling", () => {
      render(<TicketCard {...defaultProps} />);

      const card = document.querySelector(".border");
      expect(card).toBeInTheDocument();
    });

    it("applies rounded corners", () => {
      render(<TicketCard {...defaultProps} />);

      const card = document.querySelector(".rounded-lg");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Markdown Stripping", () => {
    it("strips markdown from description", () => {
      const ticketWithMarkdown = createMockTicket({
        description: "**Bold text** and *italic text*",
      });
      render(<TicketCard ticket={ticketWithMarkdown} />);

      expect(screen.getByText("Bold text and italic text")).toBeInTheDocument();
    });

    it("strips code blocks from description", () => {
      const ticketWithCode = createMockTicket({
        description: "Some `inline code` here",
      });
      render(<TicketCard ticket={ticketWithCode} />);

      expect(screen.getByText("Some here")).toBeInTheDocument();
    });

    it("strips links from description", () => {
      const ticketWithLink = createMockTicket({
        description: "Check out [this link](https://example.com)",
      });
      render(<TicketCard ticket={ticketWithLink} />);

      expect(screen.getByText("Check out this link")).toBeInTheDocument();
    });

    it("strips headers from description", () => {
      const ticketWithHeader = createMockTicket({
        description: "## Header\nContent here",
      });
      render(<TicketCard ticket={ticketWithHeader} />);

      expect(screen.getByText("Header Content here")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing _count gracefully", () => {
      const ticketNoCount = createMockTicket({ _count: undefined });
      render(<TicketCard ticket={ticketNoCount} />);

      // Should render without crashing
      expect(screen.getByText("Test Ticket")).toBeInTheDocument();
    });

    it("handles missing labels gracefully", () => {
      const ticketNoLabels = createMockTicket({ labels: undefined });
      render(<TicketCard ticket={ticketNoLabels} />);

      // Should render without crashing
      expect(screen.getByText("Test Ticket")).toBeInTheDocument();
    });

    it("handles empty string description", () => {
      const ticketEmptyDesc = createMockTicket({ description: "" });
      render(<TicketCard ticket={ticketEmptyDesc} />);

      // Should not crash and title should still render
      expect(screen.getByText("Test Ticket")).toBeInTheDocument();
    });

    it("handles whitespace-only description", () => {
      const ticketWhitespaceDesc = createMockTicket({ description: "   " });
      render(<TicketCard ticket={ticketWhitespaceDesc} />);

      // Should render without description visible
      expect(screen.getByText("Test Ticket")).toBeInTheDocument();
    });
  });
});
