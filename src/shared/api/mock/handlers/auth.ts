import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { userIdFromAuthHeader, unauthorized } from "../context";

/**
 * Мок `auth` — BACKEND.md §5.2. Access-токен here — не настоящий JWT (это MSW,
 * не бэкенд), просто `mock-access.<userId>`/`mock-refresh.<userId>`; клиент
 * (shared/api/client.ts) от формы токена не зависит. Refresh должен жить в
 * httpOnly cookie, как у реального бэкенда, но Service Worker не может
 * поставить настоящий `Set-Cookie` — see комментарий в client.ts. Значение
 * кладём в `X-Mock-Set-Cookie`, страница сама делает `document.cookie = ...`.
 * Реальный бэкенд просто пришлёт обычный `Set-Cookie`, этот заголовок ему не нужен.
 */

const REFRESH_COOKIE = "sozmor_refresh";
const MOCK_SET_COOKIE_HEADER = "X-Mock-Set-Cookie";

function issueAccessToken(userId: string) {
  return `mock-access.${userId}`;
}

function issueRefreshCookie(userId: string) {
  return `${REFRESH_COOKIE}=mock-refresh.${userId}; Path=/; SameSite=Lax`;
}

function userIdFromRefreshCookie(cookie: string | undefined): string | null {
  return cookie ? (/^mock-refresh\.(.+)$/.exec(cookie)?.[1] ?? null) : null;
}

function buildAuthUser(userId: string): Dto<"AuthUserDto"> | null {
  if (userId === db.curator.id) {
    return {
      id: db.curator.id,
      role: "curator",
      curator: { id: db.curator.id, name: db.curator.name },
    };
  }
  const student = db.students.find((s) => s.id === userId);
  if (!student) return null;
  return {
    id: student.id,
    role: "student",
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarTone: student.avatarTone,
      type: student.type,
      language: student.language,
    },
  };
}

export const authHandlers: HttpHandler[] = [
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as Dto<"LoginRequestDto">;
    const loginLower = body.login?.trim().toLowerCase();

    let userId: string | null = null;
    if (loginLower === db.curator.login && body.password === db.curator.password) {
      userId = db.curator.id;
    } else {
      const student = db.students.find(
        (s) => s.login === loginLower && s.password === body.password,
      );
      if (student) userId = student.id;
    }

    if (!userId) return unauthorized("Неверный логин или пароль");

    const user = buildAuthUser(userId);
    if (!user) return unauthorized("Неверный логин или пароль");

    const response: Dto<"LoginResponseDto"> = { accessToken: issueAccessToken(userId), user };
    return HttpResponse.json(response, {
      headers: { [MOCK_SET_COOKIE_HEADER]: issueRefreshCookie(userId) },
    });
  }),

  http.post("*/auth/refresh", ({ cookies }) => {
    const userId = userIdFromRefreshCookie(cookies[REFRESH_COOKIE]);
    if (!userId || !buildAuthUser(userId)) return unauthorized("Сессия истекла");

    const response: Dto<"RefreshResponseDto"> = { accessToken: issueAccessToken(userId) };
    return HttpResponse.json(response, {
      headers: { [MOCK_SET_COOKIE_HEADER]: issueRefreshCookie(userId) },
    });
  }),

  http.post("*/auth/logout", () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        [MOCK_SET_COOKIE_HEADER]: `${REFRESH_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`,
      },
    });
  }),

  http.get("*/auth/me", ({ request }) => {
    const userId = userIdFromAuthHeader(request.headers.get("Authorization"));
    const user = userId ? buildAuthUser(userId) : null;
    if (!user) return unauthorized("Не авторизован");
    return HttpResponse.json(user);
  }),
];
