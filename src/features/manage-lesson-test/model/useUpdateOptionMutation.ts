import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor, UpdateOptionRequest } from "@/entities/lesson-test";

/** `PATCH /options/:id` — текст/правильность (эксклюзивно для `single` — на сервере). */
export function useUpdateOptionMutation(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, ...body }: UpdateOptionRequest & { optionId: string }) =>
      apiClient.patch<TestEditor>(`/options/${optionId}`, body),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonId), test),
  });
}
