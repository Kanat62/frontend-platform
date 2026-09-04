import { z } from "zod";

/** Валидация import.meta.env при загрузке приложения. */
const schema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000"),
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
   * Под MSW (`apiMock`) ходим на тот же origin, что и страница (относительные
   * пути), а не на `VITE_API_URL`: MSW перехватывает запрос на уровне Service
   * Worker независимо от того, какой origin указан в URL, а вот cookie
   * refresh-токена (shared/api/client.ts) браузер прикладывает только к
   * запросам своего origin — see `client.ts` про Set-Cookie-ограничение SW.
   */
  apiUrl: apiMock ? "" : parsed.data.VITE_API_URL.replace(/\/$/, ""),
  apiMock,
} as const;
