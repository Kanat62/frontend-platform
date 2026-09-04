import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Тот же набор хендлеров переиспользуется в Vitest-интеграционных тестах (FRONTEND.md §13). */
export const server = setupServer(...handlers);
