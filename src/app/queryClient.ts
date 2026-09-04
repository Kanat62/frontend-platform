import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";

/**
 * Единственный инстанс QueryClient. Синглтон (а не только `useState` внутри
 * провайдера), потому что его использует не только React-дерево
 * (`QueryClientProvider`), но и императивные `loader` роутера (`app/router/guards.ts`)
 * — у них нет доступа к React-контексту (FRONTEND.md §9).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // 4xx (404 «не найдено», 403 «нет доступа» и т.п.) не станут успешными от
      // повтора — 1 ретрай только на вероятно временные ошибки (сеть, 5xx). 401
      // сюда не попадает вовсе: его обрабатывает refresh-on-401 в shared/api/client.ts,
      // до того как ошибка вообще доходит до React Query.
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Локальный error-бранч экрана (FRONTEND.md §12) остаётся приоритетным; тост —
      // запасной канал для фоновых ошибок запросов, у которых уже есть данные.
      if (query.state.data !== undefined) {
        toast.error(error instanceof Error ? error.message : "Не удалось обновить данные");
      }
    },
  }),
});
