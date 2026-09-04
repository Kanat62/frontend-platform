import type { HttpHandler } from "msw";
import { authHandlers } from "./auth";

// Хендлеры добавляются по модулю по мере разработки (FRONTEND.md §13, §16):
// students.ts, lessons.ts, groups.ts, teachers.ts, meetings.ts, tests.ts,
// notes.ts, dashboard.ts, courses.ts. Каждый файл экспортирует массив
// HttpHandler и добавляется сюда.

export const handlers: HttpHandler[] = [...authHandlers];
