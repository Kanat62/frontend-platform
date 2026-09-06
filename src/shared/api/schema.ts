/**
 * Слой совместимости контракта (этап C, ARCHITECTURE.md §2).
 *
 * Раньше здесь жил ручной контракт по BACKEND.md §12. Теперь типы запросов/ответов
 * берутся из `schema.gen.ts`, который генерит `npm run gen:api` из OpenAPI бэкенда
 * (`/api/docs-json`). Этот модуль — стабильная точка импорта для `entities/*` и
 * `features/*`: он ре-экспортит `components` и хелпер `Dto<>`, а также доменные
 * enum-псевдонимы (их `openapi-typescript` инлайнит строковыми литералами прямо
 * в схемы, отдельными именами не выносит).
 *
 * Менять типы контракта здесь руками нельзя — только перегенерировать `schema.gen.ts`.
 */
export type { components, paths, operations } from "./schema.gen";
import type { components } from "./schema.gen";

/** `Dto<"StudentHeaderDto">` → `components["schemas"]["StudentHeaderDto"]`. */
export type Dto<K extends keyof components["schemas"]> = components["schemas"][K];

/* ---------- доменные enum-псевдонимы ----------
 * Совпадают со строковыми литералами в схемах schema.gen.ts; вынесены по имени
 * для читаемости в entity-типах и UI. При расхождении с бэком tsc подсветит
 * несоответствие на присваиваниях Dto-полей. */
export type Role = "student" | "curator";
export type LanguageCode = "en" | "ru";
export type CourseType = "GROUP" | "INDIVIDUAL";
export type AccessStatus = "active" | "expired" | "disabled";
export type CefrLevel = "A1" | "A2" | "B1" | "B2";
export type LessonState = "locked" | "available" | "completed";
export type StageStatus = "locked" | "current" | "completed";
export type TestAvailability = "locked" | "available" | "in_progress" | "passed" | "failed";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type WeekPlanKind = "theory" | "practice" | "rest";
export type WeekPlanStatus = "done" | "past" | "today" | "upcoming" | "locked" | "rest";
export type DayItemKind = "lesson" | "test" | "practice";
export type DayItemStatus = "done" | "missed" | "scheduled" | "cancelled";
export type QuestionType = "single" | "multiple";
export type AttemptStatus = "in_progress" | "submitted";
export type TestStatus = "draft" | "published";
export type MeetingScope = "GROUP" | "INDIVIDUAL";
/** Причина, по которой тест заблокирован — считается на сервере (FRONTEND.md §7). */
export type TestLockedReason = "lesson_not_completed" | "not_published";
export type GroupStatus = "recruiting" | "active" | "finished" | "archived";
export type TeacherStatus = "active" | "absent" | "replacement";
export type PaymentStatus = "full" | "partial" | "unpaid";
