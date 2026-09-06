import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { useResetStudentPasswordMutation } from "../model/useResetStudentPasswordMutation";

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

/** Логин + пароль ученика для куратора + «Сбросить пароль». */
export function StudentCredentials({
  studentId,
  login,
  password,
}: {
  studentId: string;
  login: string;
  password: string | null;
}) {
  const [show, setShow] = useState(false);
  const reset = useResetStudentPasswordMutation(studentId);

  const doReset = () => {
    reset.mutate(undefined, {
      onSuccess: (r) => {
        setShow(true);
        toast.success(`Новый пароль: ${r.password} — сохраните`);
      },
      onError: (e) =>
        toast.error(e instanceof ApiError ? e.message : "Не удалось сбросить пароль"),
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

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-muted-foreground">Пароль</span>
        {password ? (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{show ? password : "•".repeat(password.length)}</span>
            <button
              type="button"
              aria-label={show ? "Скрыть пароль" : "Показать пароль"}
              onClick={() => setShow((v) => !v)}
              className="shrink-0 text-muted-foreground transition hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <CopyBtn value={password} label="пароль" />
          </div>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">не сохранён — сбросьте</span>
        )}
      </div>

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
          Ученик будет разлогинен на всех устройствах.
        </p>
      </div>
    </div>
  );
}
