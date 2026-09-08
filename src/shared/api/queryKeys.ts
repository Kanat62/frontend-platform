import type { AccessStatus, CourseType, LanguageCode } from "./schema";

/**
 * Единая фабрика ключей запросов (FRONTEND.md §4.2). Разделы добавляются по мере
 * разработки модулей (шаги 4–6) — сейчас `session`, кабинет ученика (`me`) и
 * куратор: ученики/группы/преподаватели/заметки/дашборд (шаг 5).
 */

/** Фильтры списка учеников — часть ключа, чтобы каждая комбинация кэшировалась отдельно. */
export interface StudentFilters {
  q: string;
  language: "all" | LanguageCode;
  type: "all" | CourseType;
  status: "all" | AccessStatus;
  groupId: string;
  teacherId: string;
  page: number;
}

export const qk = {
  session: ["session"] as const,
  me: {
    dashboard: ["me", "dashboard"] as const,
    course: ["me", "course"] as const,
    lessons: ["me", "lessons"] as const,
    lesson: (order: number) => ["me", "lessons", order] as const,
    schedule: ["me", "schedule"] as const,
    profile: ["me", "profile"] as const,
    test: (order: number) => ["me", "tests", order] as const,
    attempt: (id: string) => ["me", "attempts", id] as const,
  },
  students: {
    list: (f: StudentFilters) => ["students", "list", f] as const,
    header: (id: string) => ["students", id, "header"] as const,
    overview: (id: string) => ["students", id, "overview"] as const,
    learning: (id: string) => ["students", id, "learning"] as const,
    practice: (id: string) => ["students", id, "practice"] as const,
    progress: (id: string) => ["students", id, "progress"] as const,
    notes: (id: string) => ["students", id, "notes"] as const,
  },
  groups: {
    all: ["groups"] as const,
    list: (status: string, language: string) => ["groups", "list", status, language] as const,
    detail: (id: string) => ["groups", id] as const,
  },
  teachers: {
    /** Общий ключ: `GET /teachers` отдаёт и полный список, и опции для селектов (`select`). */
    list: ["teachers"] as const,
    detail: (id: string) => ["teachers", id] as const,
  },
  meetings: {
    range: (range: string) => ["meetings", range] as const,
  },
  lessons: {
    catalog: (productId: string) => ["lessons", productId, "catalog"] as const,
    editor: (productId: string, order: number) => ["lessons", productId, order, "editor"] as const,
  },
  tests: {
    editor: (lessonId: string) => ["tests", lessonId, "editor"] as const,
  },
  courses: {
    products: ["courses", "products"] as const,
    previewVideo: ["courses", "preview-video"] as const,
    /** Все уроки всех продуктов с залитым видео — донор для «взять видео из другого курса». */
    videoLibrary: ["courses", "video-library"] as const,
  },
  curatorDashboard: ["curator", "dashboard"] as const,
} as const;
