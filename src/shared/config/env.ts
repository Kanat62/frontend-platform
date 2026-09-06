import { z } from "zod";

/** Валидация import.meta.env при загрузке приложения. */
const schema = z.object({
  // Пусто → относительные пути (тот же origin, что и страница). Если задан —
  // должен быть абсолютным http(s)-URL.
  VITE_API_URL: z
    .string()
    .default("")
    .refine((v) => v === "" || /^https?:\/\//.test(v), "VITE_API_URL должен быть http(s)-URL или пустым"),
  VITE_API_MOCK: z.enum(["0", "1"]).default("0"),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("Некорректные переменные окружения:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const apiMock = parsed.data.VITE_API_MOCK === "1";

export const env = {
  /**
   * Базовый URL API.
   * - Под MSW (`apiMock`) — пусто: воркер перехватывает запросы своего origin.
   * - Пустой `VITE_API_URL` — тоже пусто: фронт ходит относительными путями на
   *   свой origin. В dev их проксирует Vite на бэкенд (vite.config.ts), в prod
   *   бэкенд живёт за тем же доменом. Так refresh-cookie (shared/api/client.ts)
   *   всегда first-party — работает и на `localhost`, и на `127.0.0.1`, без CORS.
   * - Абсолютный `VITE_API_URL` — прямой доступ к бэкенду (нужен рабочий CORS и
   *   один и тот же хост у страницы и API, иначе cookie не приложится).
   */
  apiUrl: apiMock ? "" : parsed.data.VITE_API_URL.replace(/\/$/, ""),
  apiMock,
} as const;
