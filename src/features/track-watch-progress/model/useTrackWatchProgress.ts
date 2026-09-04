import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { useWatchProgressMutation } from "./useWatchProgressMutation";

/**
 * Порт `handleProgress` из english-flow/src/routes/lesson.$order.tsx: локальный
 * `watchedPct` растёт сразу (для плавного прогресс-бара), а на сервер уходит
 * только когда процент реально вырос (сервер и так хранит максимум — `Math.max`
 * на клиенте лишь избавляет от спама одинаковых запросов на каждый `timeupdate`).
 * Порог и авто-завершение считает сервер (`completedJustNow`) — тост показываем
 * по его ответу, не по локальному расчёту (FRONTEND.md §7, инвариант 4/10).
 */
export function useTrackWatchProgress(order: number, initialWatchedPct: number) {
  const [watchedPct, setWatchedPct] = useState(initialWatchedPct);
  const lastSentRef = useRef(initialWatchedPct);
  const toastedRef = useRef(false);
  const mutation = useWatchProgressMutation(order);

  useEffect(() => {
    setWatchedPct(initialWatchedPct);
    lastSentRef.current = initialWatchedPct;
    toastedRef.current = false;
  }, [order, initialWatchedPct]);

  const onTimeUpdate = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || Number.isNaN(v.duration)) return;
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
    setWatchedPct((prev) => Math.max(prev, pct));
    if (pct <= lastSentRef.current) return;
    lastSentRef.current = pct;
    mutation.mutate(pct, {
      onSuccess: (res) => {
        if (res.completedJustNow && !toastedRef.current) {
          toastedRef.current = true;
          toast.success("Урок завершён — вы посмотрели 90%+ видео");
        }
      },
    });
  };

  return { watchedPct, onTimeUpdate };
}
