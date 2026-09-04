import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonEditorDetail, UpdateLessonRequest } from "@/entities/lesson";

/** `PATCH /lessons/:order` (роль C) — `title`/`description`/`videoUrl` (BACKEND.md §12). */
export function useUpdateLessonMutation(order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateLessonRequest) => apiClient.patch<LessonEditorDetail>(`/lessons/${order}`, body),
    onSuccess: (lesson) => {
      queryClient.setQueryData(qk.lessons.editor(order), lesson);
      void queryClient.invalidateQueries({ queryKey: qk.lessons.catalog });
      void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
      void queryClient.invalidateQueries({ queryKey: qk.me.lessons });
    },
  });
}
