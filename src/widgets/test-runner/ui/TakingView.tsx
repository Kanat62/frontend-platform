import { Clock3 } from "lucide-react";
import { formatDuration } from "@/shared/lib";
import type { TestAttemptTaking } from "@/entities/test-attempt";

// Порт TakingView из english-flow/src/routes/lesson.$order_.test.tsx.
export function TakingView({
  attempt,
  remaining,
  submitting,
  onAnswer,
  onSubmit,
}: {
  attempt: TestAttemptTaking;
  remaining: number;
  submitting: boolean;
  onAnswer: (questionId: string, optionIds: string[]) => void;
  onSubmit: () => void;
}) {
  const answeredCount = attempt.questions.filter((q) => (attempt.answers[q.id] ?? []).length > 0).length;
  const low = remaining <= 60;
  const critical = remaining <= 10;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div
        className={`sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-2xl lg:border lg:px-5 ${
          critical ? "border-destructive/50" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{attempt.title}</p>
          <p className="text-[11px] text-muted-foreground">
            Отвечено {answeredCount} из {attempt.questions.length}
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold tabular-nums ${
            critical
              ? "bg-destructive/10 text-destructive"
              : low
                ? "bg-warning-soft text-warning"
                : "bg-muted text-foreground"
          }`}
        >
          <Clock3 className="size-4" />
          {formatDuration(remaining)}
        </div>
      </div>

      {remaining <= 60 && remaining > 10 && (
        <p className="text-center text-xs font-semibold text-warning">Осталась 1 минута</p>
      )}
      {remaining <= 10 && remaining > 0 && (
        <p className="text-center text-xs font-bold text-destructive">Осталось {remaining} секунд</p>
      )}

      <div className="space-y-4">
        {attempt.questions.map((q, qi) => {
          const selected = attempt.answers[q.id] ?? [];
          return (
            <div key={q.id} className="surface-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Вопрос {qi + 1} из {attempt.questions.length}
              </p>
              <p className="mt-1.5 text-base font-bold">{q.text || "—"}</p>
              <div className="mt-3.5 space-y-2">
                {q.options.map((o) => {
                  const checked = selected.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        if (q.type === "single") {
                          onAnswer(q.id, [o.id]);
                        } else {
                          onAnswer(q.id, checked ? selected.filter((id) => id !== o.id) : [...selected, o.id]);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        checked ? "border-primary bg-primary-soft/60" : "border-border bg-surface hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className={`grid size-4 shrink-0 place-items-center border text-[10px] ${
                          q.type === "single" ? "rounded-full" : "rounded-[4px]"
                        } ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                      >
                        {checked && "✓"}
                      </span>
                      {o.text || "—"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
      >
        Отправить тест
      </button>
    </div>
  );
}
