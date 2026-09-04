import { Outlet } from "react-router";

// TODO(FRONTEND.md §16, шаг 2): порт StudentShell — sidebar desktop + bottom-nav
// mobile, useDisableZoom, гвард роли (FRONTEND.md §9, §11). Пока — только Outlet,
// чтобы дерево маршрутов (шаг 1) уже работало.
export function Component() {
  return <Outlet />;
}
