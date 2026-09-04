import { env } from "@/shared/config";
import { normalizeHttpError } from "@/shared/lib";
import { clearAccessToken, getAccessToken, setAccessToken } from "./token";
import type { Dto } from "./schema";

/**
 * Fetch-обёртка — FRONTEND.md §4.1. `credentials: "include"` на каждый запрос
 * (refresh-cookie); `Authorization: Bearer <access>` из токена в памяти; на 401
 * (кроме самого `/auth/refresh`) — одна попытка `POST /auth/refresh` и повтор
 * исходного запроса. Тело ошибки нормализуется в `ApiError` (shared/lib/http-error).
 */

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /**
   * Не слать Authorization и не запускать refresh-on-401 — для самих
   * `/auth/login` и `/auth/refresh`, которым токен ещё/уже не нужен.
   */
  skipAuth?: boolean;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * MSW (Service Worker) не может проставить настоящий `Set-Cookie` — браузер
 * обязан игнорировать этот заголовок на синтетических ответах SW (ограничение
 * платформы, не наше решение: https://github.com/mswjs/msw/issues/1218).
 * Поэтому мок-хендлеры `auth.ts` кладут значение cookie в читаемый заголовок
 * `X-Mock-Set-Cookie`, а страница проставляет его сама через `document.cookie`.
 * Реальный бэкенд этот заголовок никогда не пришлёт — ветка не выполнится.
 */
function applyMockSetCookie(res: Response) {
  const value = res.headers.get("X-Mock-Set-Cookie");
  if (value) document.cookie = value;
}

async function rawFetch(path: string, init: RequestOptions): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  if (!init.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers,
    body,
    credentials: "include",
  });
  applyMockSetCookie(res);
  return res;
}

let refreshPromise: Promise<string | null> | null = null;

/** Ротация по refresh-cookie — не более одного запроса в моменте (BACKEND.md §5.1). */
function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const res = await rawFetch("/auth/refresh", { method: "POST", skipAuth: true });
      if (!res.ok) return null;
      const data = (await safeJson(res)) as Dto<"RefreshResponseDto"> | null;
      if (!data?.accessToken) return null;
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function request<TResponse = unknown>(
  path: string,
  init: RequestOptions = {},
): Promise<TResponse> {
  let res = await rawFetch(path, init);

  if (res.status === 401 && !init.skipAuth && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawFetch(path, init);
    } else {
      clearAccessToken();
      throw normalizeHttpError(401, await safeJson(res));
    }
  }

  if (!res.ok) {
    throw normalizeHttpError(res.status, await safeJson(res));
  }

  if (res.status === 204) return undefined as TResponse;
  return (await safeJson(res)) as TResponse;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestOptions) => request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "PUT", body }),
  delete: <T>(path: string, init?: RequestOptions) =>
    request<T>(path, { ...init, method: "DELETE" }),
};
