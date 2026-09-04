import { Outlet } from "react-router";

// TODO(FRONTEND.md §16, шаг 2): порт CuratorShell — sidebar desktop + bottom-nav
// mobile, гвард роли (FRONTEND.md §9, §11). Пока — только Outlet.
export function Component() {
  return <Outlet />;
}
