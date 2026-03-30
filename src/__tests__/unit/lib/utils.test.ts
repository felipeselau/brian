import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
    });

    it("handles conditional classes", () => {
      expect(cn("btn", false && "btn-disabled", "btn-primary")).toBe("btn btn-primary");
    });

    it("merges tailwind classes correctly (deduplication)", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });

    it("handles empty strings and undefined", () => {
      expect(cn("btn", "", undefined, "btn-primary")).toBe("btn btn-primary");
    });

    it("handles arrays of classes", () => {
      expect(cn(["btn", "btn-primary"], "text-white")).toBe("btn btn-primary text-white");
    });
  });
});
