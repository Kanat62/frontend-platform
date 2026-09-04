/**
 * Единая фабрика ключей запросов (FRONTEND.md §4.2). Разделы добавляются по мере
 * разработки модулей (шаги 4–6) — сейчас `session` + кабинет ученика (`me`).
 */
export const qk = {
  session: ["session"] as const,
  me: {
    dashboard: ["me", "dashboard"] as const,
    course: ["me", "course"] as const,
    lessons: ["me", "lessons"] as const,
    lesson: (order: number) => ["me", "lessons", order] as const,
    schedule: ["me", "schedule"] as const,
    profile: ["me", "profile"] as const,
  },
} as const;
