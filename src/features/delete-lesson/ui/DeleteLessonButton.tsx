import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient, qk } from "@/shared/api";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";

/**
 * `DELETE /courses/products/:productId/lessons/:order` — удаляет урок; следующие
 * перенумеровываются, «текущий урок» групп/учеников клампится.
 */
export function DeleteLessonButton({
  productId,
  order,
  title,
}: {
  productId: string;
  order: number;
  title: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiClient.delete<void>(`/courses/products/${productId}/lessons/${order}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.lessons.catalog(productId) });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Урок удалён");
      navigate(paths.curator.courseProduct(productId), { replace: true });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось удалить урок"),
  });

  return (
    <ConfirmDialog
      title="Удалить урок?"
      description={`Урок ${order} «${title}» удалится вместе с тестом, практиками и прогрессом по нему. Следующие уроки сдвинутся на один номер вверх.`}
      confirmLabel="Удалить урок"
      onConfirm={() => del.mutateAsync()}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-surface px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" /> Удалить урок
        </button>
      )}
    />
  );
}
