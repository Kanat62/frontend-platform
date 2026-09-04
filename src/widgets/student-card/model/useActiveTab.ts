import { useSearchParams } from "react-router";

/** Активная вкладка карточки — в URL (`?tab=`), не в `useState` (FRONTEND.md §8.1, §9). */
export const TABS = ["Обзор", "Обучение", "Практика", "Прогресс", "Заметки", "Оплата"] as const;
export type StudentCardTab = (typeof TABS)[number];

export function useActiveTab(): [StudentCardTab, (tab: StudentCardTab) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("tab");
  const tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as StudentCardTab) : TABS[0];

  function setTab(next: StudentCardTab) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === TABS[0]) params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true },
    );
  }

  return [tab, setTab];
}
