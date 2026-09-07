import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";

/** `DELETE /students/:id` — удаляет ученика со всем прогрессом и учётной записью. */
export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiClient.delete<void>(`/students/${studentId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({ queryKey: ["curator", "dashboard"] });
      toast.success("Ученик удалён");
      navigate(paths.curator.students, { replace: true });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось удалить ученика"),
  });

  return (
    <ConfirmDialog
      title="Удалить ученика?"
      description={`«${name}», весь его прогресс, попытки тестов, оплата и практики будут удалены безвозвратно.`}
      confirmLabel="Удалить ученика"
      onConfirm={() => del.mutateAsync()}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-surface px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" /> Удалить ученика
        </button>
      )}
    />
  );
}
