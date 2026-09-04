import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      retry: 1,
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
