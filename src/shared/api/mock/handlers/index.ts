import type { HttpHandler } from "msw";

// Хендлеры добавляются по модулю по мере разработки (FRONTEND.md §13, §16):
// auth.ts, students.ts, lessons.ts, groups.ts, teachers.ts, meetings.ts,
// tests.ts, notes.ts, dashboard.ts, courses.ts. Каждый файл экспортирует
// массив HttpHandler и добавляется сюда.

export const handlers: HttpHandler[] = [];
