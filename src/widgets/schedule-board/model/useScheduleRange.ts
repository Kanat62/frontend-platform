import { useSearchParams } from "react-router";

export const RANGES = [
  { value: "today", label: "Сегодня" },
  { value: "week", label: "Эта неделя" },
  { value: "next-week", label: "Следующая неделя" },
] as const;

export type RangeValue = (typeof RANGES)[number]["value"];

/** Выбранный диапазон расписания — в URL (FRONTEND.md §8.1, §9: `schedule (?range,new)`). */
export function useScheduleRange(): [RangeValue, (v: RangeValue) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = (searchParams.get("range") as RangeValue | null) ?? "today";

  function update(v: RangeValue) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v === "today") next.delete("range");
        else next.set("range", v);
        return next;
      },
      { replace: true },
    );
  }

  return [range, update];
}
