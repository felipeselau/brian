import { vi, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const mockR2 = {
  uploadFile: vi.fn(async (file: File) => ({
    url: `https://mock-r2.cloudflare.com/uploads/${file.name}`,
    key: `uploads/${Date.now()}-${file.name}`,
    size: file.size,
  })),
  deleteFile: vi.fn(async (key: string) => true),
  getSignedUrl: vi.fn(
    async (key: string) => `https://mock-r2.cloudflare.com/uploads/${key}?signed=true`
  ),
};

vi.mock("@/lib/r2", () => mockR2);

export const mockResend = {
  emails: {
    send: vi.fn(async ({ to, subject, html }: { to: string; subject: string; html: string }) => ({
      id: `email-${Date.now()}`,
      from: "test@brian.dev",
      to,
      subject,
    })),
  },
};

vi.mock("resend", () => ({
  Resend: vi.fn(() => mockResend),
}));

export const handlers = [
  http.post("https://api.resend.com/emails", async () => {
    return HttpResponse.json({
      id: `email-${Date.now()}`,
    });
  }),

  http.post("https://mock-r2.cloudflare.com/upload", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    return HttpResponse.json({
      url: `https://mock-r2.cloudflare.com/uploads/${file.name}`,
      key: `uploads/${Date.now()}-${file.name}`,
      size: file.size,
    });
  }),

  http.delete("https://mock-r2.cloudflare.com/uploads/:key", async () => {
    return HttpResponse.json({ success: true });
  }),

  http.get("https://api.unsplash.com/photos/random", async () => {
    return HttpResponse.json({
      id: "unsplash-mock-id",
      urls: {
        regular: "https://images.unsplash.com/photo-mock",
        small: "https://images.unsplash.com/photo-mock?w=400",
        thumb: "https://images.unsplash.com/photo-mock?w=200",
      },
      alt_description: "Mock image description",
      user: {
        name: "Mock Photographer",
        username: "mockuser",
      },
    });
  }),
];

export const server = setupServer(...handlers);

export function setupMocks() {
  beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());
}

export function mockAuthSession(userId: string, role: string = "WORKER") {
  return {
    user: {
      id: userId,
      email: `${userId}@brian.dev`,
      name: `Test User ${userId}`,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function mockFile(
  name: string = "test.png",
  type: string = "image/png",
  size: number = 1024
): File {
  const content = new Blob(["test content"], { type });
  return new File([content], name, { type, lastModified: Date.now() });
}

export function mockFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}
