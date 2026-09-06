import { useEffect, useState } from "react";

/**
 * Окно подключения к практике (реш. владельца продукта): кнопка «Подключиться»
 * активна с момента начала (`startTime`) и до конца дня; до начала — заблокирована
 * с таймером обратного отсчёта.
 *
 * TODO(ТЗ §15.6/§15.9): `TODAY` в проекте — заглушка, поэтому момент начала
 * считаем от реального локального «сегодня + startTime» (устройство ≈ Asia/Bishkek),
 * а не от `date` встречи. При переходе на реальную дату/таймзону — считать от
 * `meeting.date` + `meeting.startTime` в `Asia/Bishkek`.
 */
function startOfPracticeToday(startTime: string): number {
  const [h, m] = startTime.split(":").map((x) => Number.parseInt(x, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.getTime();
}

/** «2 ч 05 мин» / «12 мин 03 сек» / «08 сек». */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const min = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h} ч ${pad(min)} мин`;
  if (min > 0) return `${min} мин ${pad(sec)} сек`;
  return `${pad(sec)} сек`;
}

export interface PracticeJoinWindow {
  /** Можно ли уже подключаться (startTime наступил). */
  open: boolean;
  /** Строка обратного отсчёта до начала; `null`, когда уже открыто. */
  countdown: string | null;
}

/** Тикает раз в секунду, пока не наступит `startTime`. */
export function usePracticeJoinWindow(startTime: string | undefined | null): PracticeJoinWindow {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startTime) return { open: true, countdown: null };
  const start = startOfPracticeToday(startTime);
  if (now >= start) return { open: true, countdown: null };
  return { open: false, countdown: formatCountdown(start - now) };
}
