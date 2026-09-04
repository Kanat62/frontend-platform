import type { HttpHandler } from "msw";
import { authHandlers } from "./auth";
import { meHandlers } from "./me";
import { testsHandlers } from "./tests";
import { studentsHandlers } from "./students";
import { notesHandlers } from "./notes";
import { groupsHandlers } from "./groups";
import { teachersHandlers } from "./teachers";
import { dashboardHandlers } from "./dashboard";
import { lessonsHandlers } from "./lessons";

// Хендлеры добавляются по модулю по мере разработки (FRONTEND.md §13, §16):
// meetings.ts (полный CRUD), lessons.ts (curator-редактирование) — шаг 6.
// Каждый файл экспортирует массив HttpHandler и добавляется сюда.

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...meHandlers,
  ...testsHandlers,
  ...studentsHandlers,
  ...notesHandlers,
  ...groupsHandlers,
  ...teachersHandlers,
  ...dashboardHandlers,
  ...lessonsHandlers,
];
