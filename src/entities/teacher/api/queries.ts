import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TeacherOption } from "../model/types";

/**
 * `GET /teachers` — минимальный список для селектов (students-table, group-detail,
 * create-student). Полные карточки/список преподавателей — шаг 6 (FRONTEND.md §16).
 */
export function teacherOptionsQueryOptions() {
  return queryOptions({
    queryKey: qk.teachers.options,
    queryFn: () => apiClient.get<TeacherOption[]>("/teachers"),
    staleTime: 5 * 60_000, // список преподавателей меняется редко
  });
}

export function useTeacherOptionsQuery() {
  return useQuery(teacherOptionsQueryOptions());
}
