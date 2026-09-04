/**
 * Держатель access-токена в памяти вкладки (не localStorage) — FRONTEND.md §4.1.
 * Живёт в `shared`, потому что `shared/api/client.ts` не может зависеть от
 * `entities/session` (направление импортов FSD — только вниз). Публичный путь,
 * задокументированный в FRONTEND.md §5 (`entities/session/model/token.ts`),
 * реэкспортирует эти же функции — единый источник здесь.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
