import { HttpResponse } from "msw";
import { db } from "./db";
import { effectiveAccessStatus } from "./domain";
import type { Student } from "./seed-data/mock-data";

/** Общие мелочи для MSW-хендлеров: разбор Bearer-токена, стандартные ошибки. */

export function userIdFromAuthHeader(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  return /^mock-access\.(.+)$/.exec(token)?.[1] ?? null;
}

/** Текущий студент по токену запроса — IDOR исключён «в конструкции»: id всегда из токена. */
export function currentStudent(request: Request): Student | null {
  const userId = userIdFromAuthHeader(request.headers.get("Authorization"));
  if (!userId) return null;
  return db.students.find((s) => s.id === userId) ?? null;
}

/**
 * Гейт роли curator для `/students`, `/groups`, `/teachers`, `/notes`,
 * `/curator/*` — эти эндпоинты не про конкретного пользователя (как `/me/*`),
 * а про роль. Возвращает `Response`, если запрос не от куратора, иначе `null`.
 */
export function requireCurator(request: Request): Response | null {
  const userId = userIdFromAuthHeader(request.headers.get("Authorization"));
  if (!userId) return unauthorized();
  if (userId !== db.curator.id) return forbidden();
  return null;
}

export function unauthorized(message = "Не авторизован") {
  return HttpResponse.json({ statusCode: 401, error: "Unauthorized", message }, { status: 401 });
}

export function forbidden(message = "Доступ запрещён") {
  return HttpResponse.json({ statusCode: 403, error: "Forbidden", message }, { status: 403 });
}

export function notFound(message = "Не найдено") {
  return HttpResponse.json({ statusCode: 404, error: "Not Found", message }, { status: 404 });
}

export function badRequest(message: string) {
  return HttpResponse.json({ statusCode: 400, error: "Bad Request", message }, { status: 400 });
}

/**
 * Гейт учебных мутаций (`watch`, старт/ответы/submit теста) при неактивном доступе
 * (BACKEND.md §7.6) — `403`, чтение (`/me/*` GET) не гейтится. Возвращает `Response`,
 * если доступ неактивен, иначе `null` (мутация может продолжаться).
 */
export function requireActiveAccess(student: Student): Response | null {
  if (effectiveAccessStatus(student) !== "active") return forbidden("Доступ к обучению закрыт");
  return null;
}
