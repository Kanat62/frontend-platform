import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";

/** `DELETE /notes/:id` — BACKEND.md §12. */
export function useDeleteNoteMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => apiClient.delete(`/notes/${noteId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.students.notes(studentId) });
    },
  });
}
