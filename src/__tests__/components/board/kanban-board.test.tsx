import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TicketStatus } from "@prisma/client";
import { toast } from "sonner";

// Mock router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

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
  usePathname: () => "/projects/project-1",
}));

// Mock columns
const mockColumns = [
  { id: "backlog", title: "Backlog", order: 0 },
  { id: "in_progress", title: "In Progress", order: 1 },
  { id: "review", title: "Review", order: 2 },
  { id: "done", title: "Done", order: 3 },
];

// Mock ticket factory
const createMockTicket = (overrides = {}) => ({
  id: "ticket-1",
  title: "Test Ticket",
  description: "Test description",
  status: "BACKLOG" as TicketStatus,
  estimatedHours: 8,
  loggedHours: 4,
  assignedTo: null,
  _count: {
    comments: 0,
    attachments: 0,
  },
  labels: [],
  dueDate: null,
  coverImage: null,
  ...overrides,
});

describe("KanbanBoard", () => {
  const defaultProps = {
    projectId: "project-1",
    initialColumns: mockColumns,
    initialTickets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("Rendering", () => {
    it("renders all columns", () => {
      render(<KanbanBoard {...defaultProps} />);

      expect(screen.getByText("Backlog")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("renders columns in order", () => {
      render(<KanbanBoard {...defaultProps} />);

      const columns = screen.getAllByRole("heading", { level: 3 });
      const columnTitles = columns.map((col) => col.textContent);

      expect(columnTitles).toEqual(["Backlog", "In Progress", "Review", "Done"]);
    });

    it("renders tickets in correct columns", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1", title: "Backlog Ticket", status: "BACKLOG" }),
        createMockTicket({ id: "ticket-2", title: "In Progress Ticket", status: "IN_PROGRESS" }),
        createMockTicket({ id: "ticket-3", title: "Done Ticket", status: "DONE" }),
      ];
      render(<KanbanBoard {...defaultProps} initialTickets={tickets} />);

      expect(screen.getByText("Backlog Ticket")).toBeInTheDocument();
      expect(screen.getByText("In Progress Ticket")).toBeInTheDocument();
      expect(screen.getByText("Done Ticket")).toBeInTheDocument();
    });

    it("shows empty state for columns without tickets", () => {
      render(<KanbanBoard {...defaultProps} initialTickets={[]} />);

      const emptyMessages = screen.getAllByText("No tickets yet");
      expect(emptyMessages.length).toBe(4); // All 4 columns should show empty state
    });
  });

  describe("Column Counts", () => {
    it("displays correct ticket count per column", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1", status: "BACKLOG" }),
        createMockTicket({ id: "ticket-2", status: "BACKLOG" }),
        createMockTicket({ id: "ticket-3", status: "IN_PROGRESS" }),
      ];
      render(<KanbanBoard {...defaultProps} initialTickets={tickets} />);

      // Find count badges - they appear after the column titles
      const countBadges = screen.getAllByText(/^[0-4]$/);
      expect(countBadges).toHaveLength(4); // One per column
    });
  });

  describe("Ticket Navigation", () => {
    it("navigates to ticket detail when ticket is clicked", async () => {
      const user = userEvent.setup();
      const tickets = [createMockTicket({ id: "ticket-123", title: "Click Me" })];
      render(<KanbanBoard {...defaultProps} initialTickets={tickets} />);

      const ticketCard = screen.getByText("Click Me").closest(".cursor-pointer");
      await user.click(ticketCard!);

      expect(mockPush).toHaveBeenCalledWith("/projects/project-1/tickets/ticket-123");
    });
  });

  describe("Add Ticket Callback", () => {
    it("calls onAddTicket with column id", async () => {
      const user = userEvent.setup();
      const onAddTicket = vi.fn();
      render(<KanbanBoard {...defaultProps} onAddTicket={onAddTicket} />);

      // Find the add button in the first column (Backlog)
      const addButtons = screen.getAllByRole("button");
      await user.click(addButtons[0]);

      expect(onAddTicket).toHaveBeenCalledWith("backlog");
    });
  });

  describe("Additional Columns", () => {
    it("handles blocked and waiting columns", () => {
      const columnsWithExtras = [
        ...mockColumns,
        { id: "blocked", title: "Blocked", order: 4 },
        { id: "waiting", title: "Waiting", order: 5 },
      ];
      const tickets = [
        createMockTicket({ id: "ticket-1", status: "BLOCKED", title: "Blocked Task" }),
        createMockTicket({ id: "ticket-2", status: "WAITING", title: "Waiting Task" }),
      ];
      render(
        <KanbanBoard
          {...defaultProps}
          initialColumns={columnsWithExtras}
          initialTickets={tickets}
        />
      );

      expect(screen.getByText("Blocked")).toBeInTheDocument();
      expect(screen.getByText("Waiting")).toBeInTheDocument();
      expect(screen.getByText("Blocked Task")).toBeInTheDocument();
      expect(screen.getByText("Waiting Task")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("has horizontal scrolling container", () => {
      render(<KanbanBoard {...defaultProps} />);

      const container = document.querySelector(".overflow-x-auto");
      expect(container).toBeInTheDocument();
    });

    it("has gap between columns", () => {
      render(<KanbanBoard {...defaultProps} />);

      const container = document.querySelector(".gap-4");
      expect(container).toBeInTheDocument();
    });

    it("has flex layout", () => {
      render(<KanbanBoard {...defaultProps} />);

      const container = document.querySelector(".flex");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Props Updates", () => {
    it("updates tickets when initialTickets prop changes", () => {
      const { rerender } = render(<KanbanBoard {...defaultProps} initialTickets={[]} />);

      expect(screen.getAllByText("No tickets yet").length).toBe(4);

      const newTickets = [createMockTicket({ title: "New Ticket" })];
      rerender(<KanbanBoard {...defaultProps} initialTickets={newTickets} />);

      expect(screen.getByText("New Ticket")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty columns array", () => {
      render(<KanbanBoard {...defaultProps} initialColumns={[]} />);

      // Should render without errors
      expect(document.querySelector(".flex")).toBeInTheDocument();
    });

    it("handles single column", () => {
      const singleColumn = [{ id: "backlog", title: "Backlog", order: 0 }];
      render(<KanbanBoard {...defaultProps} initialColumns={singleColumn} />);

      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });

    it("handles tickets with unknown status", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1", status: "UNKNOWN_STATUS" as TicketStatus }),
      ];
      // Should not crash
      render(<KanbanBoard {...defaultProps} initialTickets={tickets} />);
    });

    it("handles many tickets", () => {
      const manyTickets = Array.from({ length: 100 }, (_, i) =>
        createMockTicket({
          id: `ticket-${i}`,
          title: `Ticket ${i}`,
          status: "BACKLOG",
        })
      );
      render(<KanbanBoard {...defaultProps} initialTickets={manyTickets} />);

      // Should render without crashing
      expect(screen.getByText("Ticket 0")).toBeInTheDocument();
    });
  });

  describe("Multiple Tickets Per Column", () => {
    it("renders multiple tickets in same column", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1", title: "First", status: "BACKLOG" }),
        createMockTicket({ id: "ticket-2", title: "Second", status: "BACKLOG" }),
        createMockTicket({ id: "ticket-3", title: "Third", status: "BACKLOG" }),
      ];
      render(<KanbanBoard {...defaultProps} initialTickets={tickets} />);

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });
  });

  describe("Column Order", () => {
    it("respects column order property", () => {
      const unorderedColumns = [
        { id: "done", title: "Done", order: 3 },
        { id: "backlog", title: "Backlog", order: 0 },
        { id: "review", title: "Review", order: 2 },
        { id: "in_progress", title: "In Progress", order: 1 },
      ];
      render(<KanbanBoard {...defaultProps} initialColumns={unorderedColumns} />);

      const columns = screen.getAllByRole("heading", { level: 3 });
      const columnTitles = columns.map((col) => col.textContent);

      // Should be sorted by order property, not array order
      expect(columnTitles).toEqual(["Backlog", "In Progress", "Review", "Done"]);
    });
  });
});
