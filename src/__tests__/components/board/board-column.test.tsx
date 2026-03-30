import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardColumn } from "@/components/board/board-column";
import { TicketStatus } from "@prisma/client";

// Mock ticket data
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

describe("BoardColumn", () => {
  const defaultProps = {
    id: "backlog",
    title: "Backlog",
    tickets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders column title", () => {
      render(<BoardColumn {...defaultProps} />);

      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });

    it("renders ticket count badge", () => {
      render(<BoardColumn {...defaultProps} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders correct ticket count", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1" }),
        createMockTicket({ id: "ticket-2" }),
        createMockTicket({ id: "ticket-3" }),
      ];
      render(<BoardColumn {...defaultProps} tickets={tickets} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders add button when onAddTicket is provided", () => {
      render(<BoardColumn {...defaultProps} onAddTicket={() => {}} />);

      const addButton = screen.getByRole("button");
      expect(addButton).toBeInTheDocument();
    });

    it("does not render add button when onAddTicket is not provided", () => {
      render(<BoardColumn {...defaultProps} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no tickets", () => {
      render(<BoardColumn {...defaultProps} tickets={[]} />);

      expect(screen.getByText("No tickets yet")).toBeInTheDocument();
    });

    it("does not show empty message when tickets exist", () => {
      const tickets = [createMockTicket()];
      render(<BoardColumn {...defaultProps} tickets={tickets} />);

      expect(screen.queryByText("No tickets yet")).not.toBeInTheDocument();
    });
  });

  describe("Tickets", () => {
    it("renders all tickets", () => {
      const tickets = [
        createMockTicket({ id: "ticket-1", title: "First Ticket" }),
        createMockTicket({ id: "ticket-2", title: "Second Ticket" }),
      ];
      render(<BoardColumn {...defaultProps} tickets={tickets} />);

      expect(screen.getByText("First Ticket")).toBeInTheDocument();
      expect(screen.getByText("Second Ticket")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onAddTicket when add button is clicked", async () => {
      const user = userEvent.setup();
      const onAddTicket = vi.fn();
      render(<BoardColumn {...defaultProps} onAddTicket={onAddTicket} />);

      await user.click(screen.getByRole("button"));

      expect(onAddTicket).toHaveBeenCalled();
    });

    it("calls onTicketClick when a ticket is clicked", async () => {
      const user = userEvent.setup();
      const onTicketClick = vi.fn();
      const tickets = [createMockTicket({ id: "ticket-1", title: "Click Me" })];
      render(<BoardColumn {...defaultProps} tickets={tickets} onTicketClick={onTicketClick} />);

      const ticketCard = screen.getByText("Click Me").closest(".cursor-pointer");
      await user.click(ticketCard!);

      expect(onTicketClick).toHaveBeenCalledWith("ticket-1");
    });
  });

  describe("Styling", () => {
    it("has fixed width", () => {
      render(<BoardColumn {...defaultProps} />);

      const column = document.querySelector(".w-80");
      expect(column).toBeInTheDocument();
    });

    it("has min-width", () => {
      render(<BoardColumn {...defaultProps} />);

      const column = document.querySelector(".min-w-80");
      expect(column).toBeInTheDocument();
    });

    it("has background color", () => {
      render(<BoardColumn {...defaultProps} />);

      const column = document.querySelector(".bg-gray-50");
      expect(column).toBeInTheDocument();
    });

    it("has rounded corners", () => {
      render(<BoardColumn {...defaultProps} />);

      const column = document.querySelector(".rounded-lg");
      expect(column).toBeInTheDocument();
    });

    it("has scrollable ticket container", () => {
      render(<BoardColumn {...defaultProps} />);

      const ticketContainer = document.querySelector(".overflow-y-auto");
      expect(ticketContainer).toBeInTheDocument();
    });

    it("has max height on ticket container", () => {
      render(<BoardColumn {...defaultProps} />);

      const ticketContainer = document.querySelector(".max-h-\\[calc\\(100vh-300px\\)\\]");
      expect(ticketContainer).toBeInTheDocument();
    });
  });

  describe("Column Header", () => {
    it("renders header with border", () => {
      render(<BoardColumn {...defaultProps} />);

      const header = document.querySelector(".border-b");
      expect(header).toBeInTheDocument();
    });

    it("displays title in semibold font", () => {
      render(<BoardColumn {...defaultProps} />);

      const title = screen.getByText("Backlog");
      expect(title).toHaveClass("font-semibold");
    });

    it("displays count badge with styling", () => {
      render(<BoardColumn {...defaultProps} />);

      const badge = screen.getByText("0");
      expect(badge).toHaveClass("bg-gray-200");
      expect(badge).toHaveClass("rounded-full");
    });
  });

  describe("Edge Cases", () => {
    it("handles large number of tickets", () => {
      const manyTickets = Array.from({ length: 50 }, (_, i) =>
        createMockTicket({ id: `ticket-${i}`, title: `Ticket ${i}` })
      );
      render(<BoardColumn {...defaultProps} tickets={manyTickets} />);

      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("Ticket 0")).toBeInTheDocument();
      expect(screen.getByText("Ticket 49")).toBeInTheDocument();
    });

    it("handles special characters in column title", () => {
      render(<BoardColumn {...defaultProps} title="In Progress & Review" />);

      expect(screen.getByText("In Progress & Review")).toBeInTheDocument();
    });
  });

  describe("Different Column Types", () => {
    const columnTypes = [
      { id: "backlog", title: "Backlog" },
      { id: "in_progress", title: "In Progress" },
      { id: "review", title: "Review" },
      { id: "done", title: "Done" },
      { id: "blocked", title: "Blocked" },
      { id: "waiting", title: "Waiting" },
    ];

    columnTypes.forEach(({ id, title }) => {
      it(`renders ${title} column correctly`, () => {
        render(<BoardColumn {...defaultProps} id={id} title={title} />);

        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });
  });
});
