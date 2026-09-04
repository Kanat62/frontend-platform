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
import { meetingsHandlers } from "./meetings";
import { coursesHandlers } from "./courses";

// Каждый файл — по модулю (FRONTEND.md §13), экспортирует массив HttpHandler
// и добавляется сюда.

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
  ...meetingsHandlers,
  ...coursesHandlers,
];
