import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";

/** `DELETE /groups/:id` — 400, если в группе ещё есть ученики. */
export function DeleteGroupButton({ groupId, name }: { groupId: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiClient.delete<void>(`/groups/${groupId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Группа удалена");
      navigate(paths.curator.groups, { replace: true });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось удалить группу"),
  });

  return (
    <ConfirmDialog
      title="Удалить группу?"
      description={`«${name}» и все её практики будут удалены. Учеников в группе быть не должно — сначала переведите их.`}
      confirmLabel="Удалить группу"
      onConfirm={() => del.mutateAsync()}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-surface px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" /> Удалить группу
        </button>
      )}
    />
  );
}
