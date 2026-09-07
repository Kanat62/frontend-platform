import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";

/** `DELETE /teachers/:id` — отвязывает от групп/учеников и удаляет. */
export function DeleteTeacherButton({ teacherId, name }: { teacherId: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiClient.delete<void>(`/teachers/${teacherId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teachers"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Преподаватель удалён");
      navigate(paths.curator.teachers, { replace: true });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось удалить преподавателя"),
  });

  return (
    <ConfirmDialog
      title="Удалить преподавателя?"
      description={`«${name}» будет снят со всех групп и учеников (они останутся без преподавателя) и удалён.`}
      confirmLabel="Удалить преподавателя"
      onConfirm={() => del.mutateAsync()}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-surface px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" /> Удалить преподавателя
        </button>
      )}
    />
  );
}
