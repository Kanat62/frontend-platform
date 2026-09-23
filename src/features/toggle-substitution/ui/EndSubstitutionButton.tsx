import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { useEndSubstitutionMutation } from "../model/useSubstitutionMutations";

export function EndSubstitutionButton({ className }: { className?: string }) {
  const end = useEndSubstitutionMutation();

  return (
    <button
      type="button"
      onClick={() => {
        end.mutate(undefined, {
          onSuccess: () => toast.success("Замещение завершено"),
          onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось завершить замещение"),
        });
      }}
      disabled={end.isPending}
      className={
        className ??
        "rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-2 text-xs font-bold text-warning transition hover:opacity-80 disabled:opacity-60"
      }
    >
      Завершить замещение
    </button>
  );
}
