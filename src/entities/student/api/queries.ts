import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type StudentFilters } from "@/shared/api";
import type {
  StudentHeader,
  StudentLearning,
  StudentOverview,
  StudentPractice,
  StudentProgress,
  StudentsList,
} from "../model/types";

/** `students` (роль C) — BACKEND.md §12. Один запрос на вкладку карточки. */

function studentsSearchParams(f: StudentFilters): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.language !== "all") params.set("language", f.language);
  if (f.type !== "all") params.set("type", f.type);
  if (f.status !== "all") params.set("status", f.status);
  if (f.groupId !== "all") params.set("groupId", f.groupId);
  if (f.teacherId !== "all") params.set("teacherId", f.teacherId);
  params.set("page", String(f.page));
  return params.toString();
}

export function studentsQueryOptions(filters: StudentFilters) {
  return queryOptions({
    queryKey: qk.students.list(filters),
    queryFn: () => apiClient.get<StudentsList>(`/students?${studentsSearchParams(filters)}`),
    // Смена фильтра/страницы/поиска не гасит таблицу в скелетон — предыдущие
    // строки остаются на экране, пока едет новый ответ (isPlaceholderData → лёгкое затемнение).
    placeholderData: keepPreviousData,
  });
}

export function useStudentsQuery(filters: StudentFilters) {
  return useQuery(studentsQueryOptions(filters));
}

export function studentHeaderQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.students.header(id),
    queryFn: () => apiClient.get<StudentHeader>(`/students/${id}`),
  });
}

export function useStudentHeaderQuery(id: string) {
  return useQuery(studentHeaderQueryOptions(id));
}

export function studentOverviewQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.students.overview(id),
    queryFn: () => apiClient.get<StudentOverview>(`/students/${id}/overview`),
    staleTime: 60_000,
  });
}

export function useStudentOverviewQuery(id: string) {
  return useQuery(studentOverviewQueryOptions(id));
}

export function studentLearningQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.students.learning(id),
    queryFn: () => apiClient.get<StudentLearning>(`/students/${id}/learning`),
    staleTime: 60_000,
  });
}

export function useStudentLearningQuery(id: string) {
  return useQuery(studentLearningQueryOptions(id));
}

export function studentPracticeQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.students.practice(id),
    queryFn: () => apiClient.get<StudentPractice>(`/students/${id}/practice`),
    staleTime: 60_000,
  });
}

export function useStudentPracticeQuery(id: string) {
  return useQuery(studentPracticeQueryOptions(id));
}

export function studentProgressQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.students.progress(id),
    queryFn: () => apiClient.get<StudentProgress>(`/students/${id}/progress`),
    staleTime: 60_000,
  });
}

export function useStudentProgressQuery(id: string) {
  return useQuery(studentProgressQueryOptions(id));
}
