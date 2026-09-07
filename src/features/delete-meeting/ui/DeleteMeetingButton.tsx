import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api";
import { ApiError } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";

/** `DELETE /meetings/:id` — удаляет одну практику из расписания. */
export function DeleteMeetingButton({ meetingId, title }: { meetingId: string; title: string }) {
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiClient.delete<void>(`/meetings/${meetingId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Практика удалена");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось удалить практику"),
  });

  return (
    <ConfirmDialog
      title="Удалить практику?"
      description={`«${title}» будет удалена из расписания вместе с отметками посещаемости.`}
      confirmLabel="Удалить практику"
      onConfirm={() => del.mutateAsync()}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Удалить практику"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/30 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    />
  );
}
