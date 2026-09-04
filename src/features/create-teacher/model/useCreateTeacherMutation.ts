import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CreateTeacherRequest, TeacherListItem } from "@/entities/teacher";

/** `POST /teachers` — создать преподавателя (BACKEND.md §12). */
export function useCreateTeacherMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTeacherRequest) => apiClient.post<TeacherListItem>("/teachers", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.teachers.list });
    },
  });
}
