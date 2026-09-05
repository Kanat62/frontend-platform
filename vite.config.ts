import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/shared/testing/setup.ts"],
    css: false,
    // `e2e/*.spec.ts` — сценарии Playwright (`test` из `@playwright/test`,
    // не vitest), запускаются отдельно через `npm run e2e`.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
