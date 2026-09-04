import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

/** Дефолты клиента и глобальный обработчик фоновых ошибок — FRONTEND.md §8. */
function createQueryClient() {
  return new QueryClient({
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
        // Локальный error-бранч экрана (§12) остаётся приоритетным; тост — запасной
        // канал для запросов, у которых уже есть закэшированные данные (background refetch).
        if (query.state.data !== undefined) {
          toast.error(error instanceof Error ? error.message : "Не удалось обновить данные");
        }
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
