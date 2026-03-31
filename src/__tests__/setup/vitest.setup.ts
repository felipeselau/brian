import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { resetDatabase } from "./test-db";

// Check if we're running integration tests that need database
const needsDatabase = () => {
  // Only reset database if DATABASE_URL is set and we're not skipping
  return !!process.env.DATABASE_URL && process.env.SKIP_DB_RESET !== "true";
};

beforeAll(async () => {
  if (needsDatabase()) {
    try {
      await resetDatabase();
    } catch (error) {
      console.warn("Database reset skipped (not available):", error);
    }
  }
});

afterEach(async () => {
  if (needsDatabase()) {
    try {
      await resetDatabase();
    } catch (error) {
      // Silently skip if database is not available
    }
  }
  // Always clear mocks
  vi.clearAllMocks();
});

afterAll(async () => {
  if (needsDatabase()) {
    try {
      await resetDatabase();
    } catch (error) {
      // Silently skip if database is not available
    }
  }
});

// Mock Next.js router for all tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
}));

// Mock sonner (toast notifications)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
  closestCorners: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}));

// Mock @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
  arrayMove: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

// Mock @dnd-kit/utilities
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ""),
    },
  },
}));

// Mock fetch globally
global.fetch = vi.fn();
