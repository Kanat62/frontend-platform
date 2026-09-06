import { createBrowserRouter, type RouteObject } from "react-router";
import { ErrorBoundary } from "@/app/providers";
import { paths } from "./paths";
import { requireGuest, requireRole } from "./guards";

/**
 * Дерево маршрутов — FRONTEND.md §9. Каждая страница — `lazy()` (route-level
 * code-splitting). Гварды ролей — `loader` на layout-маршрутах (`guards.ts`).
 *
 * Роутер создаётся ЛЕНИВО через `createRouter()` (вызывается из `App.tsx` при
 * рендере), а не как синглтон на верхнем уровне модуля: `createBrowserRouter`
 * запускает loader'ы совпавших маршрутов сразу при создании — если бы `router`
 * был модульной константой, это произошло бы в момент импорта `app/App.tsx`,
 * т.е. раньше, чем `main.tsx` дожидается `await worker.start()` (MSW), и первый
 * `GET /auth/me` улетал бы мимо мок-воркера в реальную сеть.
 */
const routes: RouteObject[] = [
  {
    path: paths.login,
    lazy: () => import("@/pages/login"),
    loader: requireGuest(),
    errorElement: <ErrorBoundary />,
  },
  {
    path: paths.student.root,
    lazy: () => import("@/app/layouts/StudentLayout"),
    loader: requireRole("student"),
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
    loader: requireRole("curator"),
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
      { path: "course/:productId", lazy: () => import("@/pages/curator/course-product") },
      { path: "course/:productId/:order", lazy: () => import("@/pages/curator/lesson-editor") },
    ],
  },
  {
    path: "*",
    lazy: () => import("@/pages/not-found"),
  },
];

let router: ReturnType<typeof createBrowserRouter> | null = null;

/** Идемпотентно: повторный вызов (напр. двойной рендер React StrictMode) вернёт тот же инстанс. */
export function createRouter() {
  router ??= createBrowserRouter(routes);
  return router;
}
