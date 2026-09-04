/**
 * Единая фабрика ключей запросов (FRONTEND.md §4.2). Разделы добавляются по мере
 * разработки модулей (шаги 3–6) — сейчас только `session`.
 */
export const qk = {
  session: ["session"] as const,
} as const;
