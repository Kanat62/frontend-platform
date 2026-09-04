import { redirect } from "react-router";
import { queryClient } from "@/app/queryClient";
import { sessionQueryOptions, type Role } from "@/entities/session";
import { paths } from "./paths";

/** Куда вести пользователя с данной ролью — единая точка (FRONTEND.md §9). */
function homeFor(role: Role): string {
  return role === "curator" ? paths.curator.root : paths.student.root;
}

/**
 * Loader layout-маршрута: требует роль `role`. Нет сессии (401 после неудачного
 * silent refresh) → редирект на `/login`. Сессия другой роли → редирект в её раздел.
 * `ensureQueryData` — префетч в кэш Query, рендер экрана всё равно идёт через
 * `useSessionQuery()` (FRONTEND.md §8, §9).
 */
export function requireRole(role: Role) {
  return async () => {
    try {
      const session = await queryClient.ensureQueryData(sessionQueryOptions());
      if (session.role !== role) {
        throw redirect(homeFor(session.role));
      }
      return session;
    } catch (error) {
      if (error instanceof Response) throw error; // проброс redirect() выше
      throw redirect(paths.login);
    }
  };
}

/** Loader страницы логина: уже есть валидная сессия → сразу в свой раздел. */
export function requireGuest() {
  return async () => {
    try {
      const session = await queryClient.ensureQueryData(sessionQueryOptions());
      throw redirect(homeFor(session.role));
    } catch (error) {
      if (error instanceof Response) throw error;
      return null;
    }
  };
}
