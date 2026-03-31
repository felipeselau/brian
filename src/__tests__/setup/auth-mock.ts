/**
 * Authentication mock helpers for integration tests
 *
 * Since Next.js API routes use the auth() function from NextAuth,
 * we need to mock the session for testing authenticated routes.
 */

import { vi } from "vitest";
import type { UserRole } from "@prisma/client";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

/**
 * Creates a mock session object for testing
 */
export function createMockSession(user: MockUser): MockSession {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };
}

/**
 * Creates a mock user from seeded test data
 */
export function createMockUserFromSeeded(seededUser: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
}): MockUser {
  return {
    id: seededUser.id,
    email: seededUser.email,
    name: seededUser.name || "Unknown",
    role: seededUser.role,
    image: seededUser.image || null,
  };
}

/**
 * Creates a mock auth function that returns the given session
 * Use this with vi.mock to mock the auth module
 *
 * Example:
 * ```ts
 * vi.mock("@/lib/auth", () => ({
 *   auth: vi.fn(),
 * }));
 *
 * const mockedAuth = vi.mocked(auth);
 * mockedAuth.mockResolvedValueOnce(createMockSession(mockUser));
 * ```
 */
export function createMockAuthModule(defaultSession: MockSession | null = null) {
  return {
    auth: vi.fn().mockResolvedValue(defaultSession),
  };
}
