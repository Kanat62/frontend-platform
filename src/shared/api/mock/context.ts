import { HttpResponse } from "msw";
import { db } from "./db";
import { effectiveAccessStatus } from "./domain";
import { productIdFor, type CourseProduct, type Lesson, type LessonTest, type Student } from "./seed-data/mock-data";

/** Общие мелочи для MSW-хендлеров: разбор Bearer-токена, стандартные ошибки. */

/**
 * Резолвит `courseProductId` актора — та же роль, что у backend/CourseResolverService
 * (BACKEND.md §4/§6): GROUP — через `Group.courseProductId`, INDIVIDUAL — единственный
 * продукт на язык. Нужен всем хендлерам, которые прежде читали `db.lessons` плоским
 * списком — теперь у каждого продукта свой независимый набор уроков (TЗ §4.1).
 */
export function productIdOfStudent(student: Pick<Student, "type" | "language" | "groupId">): string {
  if (student.type === "INDIVIDUAL") return productIdFor(student.language, "INDIVIDUAL", 1);
  const group = db.groups.find((g) => g.id === student.groupId);
  return group ? group.courseProductId : productIdFor(student.language, "GROUP", 6);
}

/** Уроки конкретного продукта, отсортированные как в каталоге (по `order`, как в сиде). */
export function lessonsOfProduct(courseProductId: string): Lesson[] {
  return db.lessons.filter((l) => l.courseProductId === courseProductId);
}

/** Тесты уроков конкретного продукта — джойн через `Lesson.id` (BACKEND.md: `LessonTest.lessonId`). */
export function testsOfProduct(courseProductId: string): LessonTest[] {
  const ids = new Set(lessonsOfProduct(courseProductId).map((l) => l.id));
  return db.tests.filter((t) => ids.has(t.lessonId));
}

export function productById(courseProductId: string): CourseProduct | undefined {
  return db.products.find((p) => p.id === courseProductId);
}

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
