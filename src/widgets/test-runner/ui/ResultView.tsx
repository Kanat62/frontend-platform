import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Pill } from "@/shared/ui";
import type { TestAttemptResult } from "@/entities/test-attempt";

// Порт ResultView из english-flow/src/routes/lesson.$order_.test.tsx.
export function ResultView({ attempt }: { attempt: TestAttemptResult }) {
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-5 rise-in">
      <div className="surface-card p-6 text-center">
        <div
          className={`mx-auto grid size-14 place-items-center rounded-full ${
            attempt.passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
          }`}
        >
          {attempt.passed ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Тест завершён</p>
        <h1 className="mt-1 text-xl font-extrabold">{attempt.title}</h1>

        <p className="mt-4 text-4xl font-extrabold">
          {attempt.correctCount} / {attempt.totalQuestions}
        </p>
        <p className="mt-1 text-sm font-bold text-muted-foreground">{attempt.score}%</p>

        <div className="mt-4">
          <Pill tone={attempt.passed ? "success" : "warning"}>
            {attempt.passed ? "Тест пройден" : `Нужно повторить · проходной ${attempt.passingScore}%`}
          </Pill>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Куратор видит ваш результат и сам решает, когда открыть следующий урок.
        </p>

        <button
          onClick={() => setShowReview((v) => !v)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-bold transition hover:bg-muted"
        >
          {showReview ? "Скрыть разбор ответов" : "Показать разбор ответов"}
        </button>
      </div>

      {showReview && (
        <div className="space-y-3">
          {attempt.questions.map((q, qi) => {
            const selected = attempt.answers[q.id] ?? [];
            const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
            const isQuestionCorrect =
              correctIds.length === selected.length && correctIds.every((id) => selected.includes(id));
            return (
              <div key={q.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Вопрос {qi + 1} из {attempt.questions.length}
                  </p>
                  <Pill tone={isQuestionCorrect ? "success" : "danger"}>
                    {isQuestionCorrect ? "Верно" : "Неверно"}
                  </Pill>
                </div>
                <p className="mt-1.5 text-base font-bold">{q.text || "—"}</p>
                <div className="mt-3.5 space-y-2">
                  {q.options.map((o) => {
                    const wasSelected = selected.includes(o.id);
                    const tone = o.isCorrect
                      ? "border-success bg-success-soft/60"
                      : wasSelected
                        ? "border-destructive bg-destructive/10"
                        : "border-border bg-surface";
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium ${tone}`}
                      >
                        <span
                          className={`grid size-4 shrink-0 place-items-center border text-[10px] ${
                            q.type === "single" ? "rounded-full" : "rounded-[4px]"
                          } ${
                            o.isCorrect
                              ? "border-success bg-success text-white"
                              : wasSelected
                                ? "border-destructive bg-destructive text-white"
                                : "border-input"
                          }`}
                        >
                          {(o.isCorrect || wasSelected) && (o.isCorrect ? "✓" : "✕")}
                        </span>
                        <span className="min-w-0 flex-1">{o.text || "—"}</span>
                        {wasSelected && !o.isCorrect && (
                          <span className="shrink-0 text-[11px] font-bold text-destructive">Ваш ответ</span>
                        )}
                        {o.isCorrect && (
                          <span className="shrink-0 text-[11px] font-bold text-success">Правильный ответ</span>
                        )}
                      </div>
                    );
                  })}
                  {selected.length === 0 && (
                    <p className="text-xs text-muted-foreground">Вы не ответили на этот вопрос.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
