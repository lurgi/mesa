import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["setupTests.ts"],
    include: ["tests/**/*.{ts,tsx}"],
    globals: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/main.ts", "src/vite-env.d.ts"],
    },
  },
});
