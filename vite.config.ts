import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Корневые пути API (по контроллерам бэка). В dev проксируются на бэкенд, чтобы
 * фронт ходил на свой же origin — тогда refresh-cookie всегда first-party и
 * работает одинаково на `localhost` и `127.0.0.1`, без CORS/SameSite-сюрпризов.
 * `/curator/dashboard` — единственный API-путь под `/curator`; остальное
 * `/curator/*` это SPA-маршруты, их проксировать нельзя.
 */
const API_ROOTS = [
  "/auth",
  "/courses",
  "/curator/dashboard",
  "/groups",
  "/me",
  "/meetings",
  "/notes",
  "/options",
  "/questions",
  "/students",
  "/teachers",
  "/tests",
  "/health",
];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3010";

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 5173,
      proxy: Object.fromEntries(
        API_ROOTS.map((path) => [path, { target: apiTarget, changeOrigin: true }]),
      ),
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
  };
});
