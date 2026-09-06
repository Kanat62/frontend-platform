import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CreateLessonRequest, LessonEditorDetail } from "@/entities/lesson";

/**
 * `POST /courses/products/:productId/lessons` (роль C) — создать урок.
 * `order` присваивает сервер (max+1), поэтому после успеха просто инвалидируем
 * каталог продукта — новый урок подтянется в конец списка (TЗ §15 п.9).
 */
export function useCreateLessonMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateLessonRequest) =>
      apiClient.post<LessonEditorDetail>(`/courses/products/${productId}/lessons`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.lessons.catalog(productId) });
    },
  });
}
