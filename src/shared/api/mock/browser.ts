import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Воркер MSW для браузера — стартуется в main.tsx при VITE_API_MOCK=1. */
export const worker = setupWorker(...handlers);
