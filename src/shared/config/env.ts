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

export const env = {
  apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ""),
  apiMock: parsed.data.VITE_API_MOCK === "1",
} as const;
