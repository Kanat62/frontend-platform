import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { useResetCuratorPasswordMutation } from "../model/useResetCuratorPasswordMutation";

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Скопировать ${label}`}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      className="shrink-0 text-muted-foreground transition hover:text-foreground"
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  );
}

/** Логин куратора + «Сбросить пароль» (пароль показывается один раз при сбросе). */
export function CuratorCredentials({ curatorId, login }: { curatorId: string; login: string }) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const reset = useResetCuratorPasswordMutation(curatorId);

  const doReset = () => {
    reset.mutate(undefined, {
      onSuccess: (r) => setNewPassword(r.password),
      onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось сбросить пароль"),
    });
  };

  return (
    <div className="surface-card divide-y divide-border overflow-hidden text-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-muted-foreground">Логин</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">@{login}</span>
          <CopyBtn value={login} label="логин" />
        </div>
      </div>

      {newPassword && (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-muted-foreground">Новый пароль</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{newPassword}</span>
            <CopyBtn value={newPassword} label="пароль" />
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <button
          type="button"
          onClick={doReset}
          disabled={reset.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
        >
          <KeyRound className="size-3.5" />
          {reset.isPending ? "Сброс…" : "Сбросить пароль"}
        </button>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Пароль показывается только один раз, сразу после сброса. Куратор будет разлогинен на всех устройствах.
        </p>
      </div>
    </div>
  );
}
