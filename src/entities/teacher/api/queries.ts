import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TeacherDetail, TeacherOption, TeachersList } from "../model/types";

/**
 * `GET /teachers` — BACKEND.md §12: список + сводка статусов + счётчики
 * групп/учеников. Общий для `teacher-list` (шаг 6) и для селектов
 * (students-table, create-student, group-detail — читают только `.items`
 * через `select`, минимальный вид `TeacherOption` — подмножество полей).
 */
export function teachersQueryOptions() {
  return queryOptions({
    queryKey: qk.teachers.list,
    queryFn: () => apiClient.get<TeachersList>("/teachers"),
    staleTime: 60_000,
  });
}

export function useTeachersQuery() {
  return useQuery(teachersQueryOptions());
}

export function teacherOptionsQueryOptions() {
  return queryOptions({
    ...teachersQueryOptions(),
    select: (data: TeachersList): TeacherOption[] => data.items,
  });
}

export function useTeacherOptionsQuery() {
  return useQuery(teacherOptionsQueryOptions());
}

/** `GET /teachers/:id` — карточка: группы, individual-ученики, практики сегодня. */
export function teacherQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.teachers.detail(id),
    queryFn: () => apiClient.get<TeacherDetail>(`/teachers/${id}`),
  });
}

export function useTeacherQuery(id: string) {
  return useQuery(teacherQueryOptions(id));
}
