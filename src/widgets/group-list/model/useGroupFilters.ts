import { useSearchParams } from "react-router";

/** Фильтры списка групп — в URL (FRONTEND.md §8.1, §9: `groups (?status,lang,new)`). */
export function useGroupFilters(): [{ status: string; language: string }, (patch: { status?: string; language?: string }) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    status: searchParams.get("status") ?? "all",
    language: searchParams.get("lang") ?? "all",
  };

  function update(patch: { status?: string; language?: string }) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const merged = { ...filters, ...patch };
        if (merged.status === "all") next.delete("status");
        else next.set("status", merged.status);
        if (merged.language === "all") next.delete("lang");
        else next.set("lang", merged.language);
        return next;
      },
      { replace: true },
    );
  }

  return [filters, update];
}
