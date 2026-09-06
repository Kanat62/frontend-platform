import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonEditorDetail, UpdateLessonRequest } from "@/entities/lesson";

/** `PATCH /courses/products/:productId/lessons/:order` (роль C) — `title`/`description`/`videoUrl` (BACKEND.md §12). */
export function useUpdateLessonMutation(productId: string, order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateLessonRequest) =>
      apiClient.patch<LessonEditorDetail>(`/courses/products/${productId}/lessons/${order}`, body),
    onSuccess: (lesson) => {
      queryClient.setQueryData(qk.lessons.editor(productId, order), lesson);
      void queryClient.invalidateQueries({ queryKey: qk.lessons.catalog(productId) });
      void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
      void queryClient.invalidateQueries({ queryKey: qk.me.lessons });
    },
  });
}
