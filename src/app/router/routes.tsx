import { createBrowserRouter } from "react-router";
import { ErrorBoundary } from "@/app/providers";
import { paths } from "./paths";

/**
 * Дерево маршрутов — FRONTEND.md §9. Каждая страница — `lazy()` (route-level
 * code-splitting), гварды ролей и реальные шеллы подключаются на шаге 2
 * (`app/layouts`, `app/router/guards.ts`).
 */
export const router = createBrowserRouter([
  {
    path: paths.login,
    lazy: () => import("@/pages/login"),
    errorElement: <ErrorBoundary />,
  },
  {
    path: paths.student.root,
    lazy: () => import("@/app/layouts/StudentLayout"),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, lazy: () => import("@/pages/student/dashboard") },
      { path: "learn", lazy: () => import("@/pages/student/learn") },
      { path: "lesson/:order", lazy: () => import("@/pages/student/lesson") },
      { path: "lesson/:order/test", lazy: () => import("@/pages/student/lesson-test") },
      { path: "schedule", lazy: () => import("@/pages/student/schedule") },
      { path: "profile", lazy: () => import("@/pages/student/profile") },
    ],
  },
  {
    path: paths.curator.root,
    lazy: () => import("@/app/layouts/CuratorLayout"),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, lazy: () => import("@/pages/curator/overview") },
      { path: "students", lazy: () => import("@/pages/curator/students") },
      { path: "students/:id", lazy: () => import("@/pages/curator/student-detail") },
      { path: "groups", lazy: () => import("@/pages/curator/groups") },
      { path: "groups/:id", lazy: () => import("@/pages/curator/group-detail") },
      { path: "teachers", lazy: () => import("@/pages/curator/teachers") },
      { path: "teachers/:id", lazy: () => import("@/pages/curator/teacher-detail") },
      { path: "schedule", lazy: () => import("@/pages/curator/schedule") },
      { path: "course", lazy: () => import("@/pages/curator/course") },
      { path: "course/:order", lazy: () => import("@/pages/curator/lesson-editor") },
    ],
  },
  {
    path: "*",
    lazy: () => import("@/pages/not-found"),
  },
]);
