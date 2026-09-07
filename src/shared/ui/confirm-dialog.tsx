import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./modal";

/**
 * Подтверждение необратимого действия. Кнопка-триггер + модалка. `onConfirm`
 * может быть async — пока промис не разрешится, показывается «…».
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Удалить",
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <Modal onClose={() => !busy && setOpen(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground disabled:opacity-60"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void run()}
                disabled={busy}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "…" : confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
