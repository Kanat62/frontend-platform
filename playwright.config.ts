import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-сценарии приёмки (TЗ §13.1, §13.2) — против фронта на MSW (пока нет
 * реального бэкенда, ARCHITECTURE.md §7 этап A). `webServer` поднимает
 * `vite preview` на билде, чтобы тесты не зависели от состояния dev-сервера.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
