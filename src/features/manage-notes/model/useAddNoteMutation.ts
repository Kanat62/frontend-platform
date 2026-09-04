import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { AddNoteRequest, Note } from "@/entities/note";

/** `POST /students/:id/notes` — BACKEND.md §12 (author — из токена куратора). */
export function useAddNoteMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AddNoteRequest) => apiClient.post<Note>(`/students/${studentId}/notes`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.students.notes(studentId) });
    },
  });
}
