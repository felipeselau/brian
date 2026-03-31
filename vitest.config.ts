import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    fileParallelism: false,
    setupFiles: ["./src/__tests__/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
        ".next/**",
        "e2e/**",
        "scripts/**",
        "prisma/**",
      ],
      // BLOCKING thresholds - PRs will fail if below these
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 65,
        statements: 70,
      },
    },
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "e2e", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
