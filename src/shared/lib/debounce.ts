import { useEffect, useState } from "react";

/** Возвращает `value`, обновляя его не чаще чем раз в `delayMs` — для полей поиска. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
