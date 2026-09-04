import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type Dto } from "@/shared/api";

/**
 * `POST /me/lessons/:order/watch` — порт `updateWatchProgress`/`completeLesson`
 * из store.tsx (BACKEND.md §7.2). Авто-завершение по порогу 90% считает сервер
 * (`completedJustNow` в ответе) — фронт по этому флагу просто показывает тост.
 * После успеха сбрасывается весь кэш `me` — статус урока виден на нескольких
 * экранах (курс, дашборд, карточка урока) сразу.
 */
export function useWatchProgressMutation(order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pct: number) =>
      apiClient.post<Dto<"WatchProgressResponseDto">>(`/me/lessons/${order}/watch`, { pct }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
