import { useSearchParams } from "react-router";
import type { StudentFilters } from "@/entities/student";

/**
 * Фильтры таблицы учеников — в URL (`useSearchParams`), не в `useState` как в
 * референсе (FRONTEND.md §8.1 — осознанное отступление: состояние не теряется
 * при перезагрузке и им можно поделиться ссылкой). Имена параметров — по
 * маршруту из FRONTEND.md §9: `?q,lang,format,status,group,teacher,page`.
 */

const DEFAULTS: StudentFilters = {
  q: "",
  language: "all",
  type: "all",
  status: "all",
  groupId: "all",
  teacherId: "all",
  page: 1,
};

const PARAM_KEYS = {
  q: "q",
  language: "lang",
  type: "format",
  status: "status",
  groupId: "group",
  teacherId: "teacher",
  page: "page",
} as const;

export function useStudentFilters(): [StudentFilters, (patch: Partial<StudentFilters>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: StudentFilters = {
    q: searchParams.get(PARAM_KEYS.q) ?? DEFAULTS.q,
    language: (searchParams.get(PARAM_KEYS.language) as StudentFilters["language"]) ?? DEFAULTS.language,
    type: (searchParams.get(PARAM_KEYS.type) as StudentFilters["type"]) ?? DEFAULTS.type,
    status: (searchParams.get(PARAM_KEYS.status) as StudentFilters["status"]) ?? DEFAULTS.status,
    groupId: searchParams.get(PARAM_KEYS.groupId) ?? DEFAULTS.groupId,
    teacherId: searchParams.get(PARAM_KEYS.teacherId) ?? DEFAULTS.teacherId,
    page: Number(searchParams.get(PARAM_KEYS.page)) || DEFAULTS.page,
  };

  function update(patch: Partial<StudentFilters>) {
    const merged: StudentFilters = { ...filters, ...patch };
    // Смена любого фильтра, кроме самой страницы, возвращает на страницу 1
    // (порт `useEffect(() => setPage(1), [...])` из референса).
    if (!("page" in patch)) merged.page = 1;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const entries: [keyof StudentFilters, string | number][] = [
          ["q", merged.q],
          ["language", merged.language],
          ["type", merged.type],
          ["status", merged.status],
          ["groupId", merged.groupId],
          ["teacherId", merged.teacherId],
          ["page", merged.page],
        ];
        for (const [key, value] of entries) {
          const paramKey = PARAM_KEYS[key];
          if (value === DEFAULTS[key]) next.delete(paramKey);
          else next.set(paramKey, String(value));
        }
        return next;
      },
      { replace: true },
    );
  }

  return [filters, update];
}
