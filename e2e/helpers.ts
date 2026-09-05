import type { Page } from "@playwright/test";

/**
 * `page.goto` без ожидания `load` — SPA рендерится сразу после
 * `domcontentloaded`, а `load` ждёт ещё и внешний шрифт (Google Fonts,
 * index.html), который в песочнице без доступа в интернет может годами висеть
 * в `net::ERR_CONNECTION_TIMED_OUT` и валить навигацию по таймауту.
 */
export function goto(page: Page, path: string) {
  return page.goto(path, { waitUntil: "domcontentloaded" });
}
