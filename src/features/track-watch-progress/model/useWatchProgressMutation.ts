import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/**
 * `POST /me/lessons/:order/watch` — порт `updateWatchProgress`/`completeLesson`
 * из store.tsx (BACKEND.md §7.2). Авто-завершение по порогу 90% считает сервер
 * (`completedJustNow` в ответе) — фронт по этому флагу показывает тост.
 *
 * ВАЖНО: текущий урок НЕ рефетчим — только патчим кэш `setQueryData`. Рефетч
 * `/me/lessons/:order` вернул бы новый подписанный Bunny-URL → `<video key={src}>`
 * ремоунтился бы и плеер прыгал в начало каждые пару секунд. Сводные экраны
 * (дашборд/курс/список/расписание) обновляем только когда урок реально завершён.
 */
export function useWatchProgressMutation(order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pct: number) =>
      apiClient.post<Dto<"WatchProgressResponseDto">>(`/me/lessons/${order}/watch`, { pct }),
    onSuccess: (res) => {
      queryClient.setQueryData<Dto<"LessonDetailDto">>(qk.me.lesson(order), (prev) =>
        prev ? { ...prev, watchedPct: res.watchedPct, state: res.state } : prev,
      );
      if (res.completedJustNow) {
        void queryClient.invalidateQueries({ queryKey: qk.me.dashboard });
        void queryClient.invalidateQueries({ queryKey: qk.me.course });
        void queryClient.invalidateQueries({ queryKey: qk.me.lessons, exact: true });
        void queryClient.invalidateQueries({ queryKey: qk.me.schedule });
      }
    },
  });
}
