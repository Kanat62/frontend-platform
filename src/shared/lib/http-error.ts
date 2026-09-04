/** Нормализация тела ошибки бэкенда (BACKEND.md §8) в единый вид. */

export interface ApiErrorShape {
  status: number;
  message: string;
  code?: string;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number;
  readonly code?: string;

  constructor({ status, message, code }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (code !== undefined) this.code = code;
  }
}

interface RawErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export function normalizeHttpError(status: number, body: unknown): ApiError {
  const raw = (body ?? {}) as RawErrorBody;
  const message = Array.isArray(raw.message)
    ? raw.message.join(", ")
    : (raw.message ?? raw.error ?? `Ошибка запроса (${status})`);
  return new ApiError({ status: raw.statusCode ?? status, message, code: raw.error });
}
