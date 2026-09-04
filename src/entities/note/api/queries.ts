import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { Note } from "../model/types";

/** `GET /students/:id/notes` — BACKEND.md §12. */
export function notesQueryOptions(studentId: string) {
  return queryOptions({
    queryKey: qk.students.notes(studentId),
    queryFn: () => apiClient.get<Note[]>(`/students/${studentId}/notes`),
  });
}

export function useNotesQuery(studentId: string) {
  return useQuery(notesQueryOptions(studentId));
}
