import type { HttpHandler } from "msw";
import { authHandlers } from "./auth";
import { meHandlers } from "./me";
import { testsHandlers } from "./tests";

// Хендлеры добавляются по модулю по мере разработки (FRONTEND.md §13, §16):
// students.ts, groups.ts, teachers.ts, meetings.ts, notes.ts, dashboard.ts,
// courses.ts, lessons.ts (curator-редактирование). Каждый файл экспортирует
// массив HttpHandler и добавляется сюда.

export const handlers: HttpHandler[] = [...authHandlers, ...meHandlers, ...testsHandlers];
