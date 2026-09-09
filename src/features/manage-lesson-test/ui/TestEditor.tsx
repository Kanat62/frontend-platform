import type { ReactNode } from "react";
import { FileText, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import { TestStatusPill, useTestEditorQuery, type QuestionType } from "@/entities/lesson-test";
import { useCreateTestMutation, useDeleteTestMutation, useUpdateTestMutation } from "../model/useTestMutations";
import { useAddQuestionMutation, useDeleteQuestionMutation, useUpdateQuestionMutation } from "../model/useQuestionMutations";
import { useUpdateOptionMutation } from "../model/useUpdateOptionMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

function onApiError(fallback: string) {
  return (error: unknown) => toast.error(error instanceof ApiError ? error.message : fallback);
}

// Порт «Тест к уроку» из curator.course.$order.tsx (LessonEditorPage). Текстовые
// поля сохраняются по `onBlur`, а не на каждое нажатие (как в group-detail
// meetUrl) — реф. хранит их в клиентском сторе, у нас это сетевой запрос.
export function TestEditor({
  lessonId,
  /** Действие «Взять тест из другого курса» — компонуется в widgets/lesson-editor
   * (feature→feature импорт запрещён FSD, поэтому кнопка приходит слотом). */
  actionsSlot,
}: {
  lessonId: string;
  actionsSlot?: ReactNode;
}) {
  const testQuery = useTestEditorQuery(lessonId);
  const createTest = useCreateTestMutation(lessonId);
  const test = testQuery.data;

  const updateTest = useUpdateTestMutation(test?.id ?? "", lessonId);
  const deleteTest = useDeleteTestMutation(test?.id ?? "", lessonId);
  const addQuestion = useAddQuestionMutation(test?.id ?? "", lessonId);
  const updateQuestion = useUpdateQuestionMutation(lessonId);
  const deleteQuestion = useDeleteQuestionMutation(lessonId);
  const updateOption = useUpdateOptionMutation(lessonId);

  if (testQuery.isPending) {
    return (
      <section className="surface-card space-y-3.5 p-5">
        <SectionTitle title="Тест к уроку" icon={FileText} />
        <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
      </section>
    );
  }

  return (
    <section className="surface-card space-y-3.5 p-5">
      <SectionTitle title="Тест к уроку" icon={FileText} />
      {!test ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">У этого урока пока нет теста.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => createTest.mutate(undefined, { onError: onApiError("Не удалось создать тест") })}
              disabled={createTest.isPending}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-3.5" /> Создать тест
            </button>
            {actionsSlot}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-xs font-semibold text-muted-foreground">
              Название теста
              <input
                key={test.id}
                defaultValue={test.title}
                onBlur={(e) => {
                  const title = e.target.value.trim();
                  if (title && title !== test.title) updateTest.mutate({ title });
                }}
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="w-28 text-xs font-semibold text-muted-foreground">
              Время (мин)
              <input
                key={test.id}
                type="number"
                min={1}
                defaultValue={Math.round(test.timeLimitSec / 60)}
                onBlur={(e) => updateTest.mutate({ timeLimitSec: Math.max(1, Number(e.target.value) || 1) * 60 })}
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="w-32 text-xs font-semibold text-muted-foreground">
              Проходной, %
              <input
                key={test.id}
                type="number"
                min={0}
                max={100}
                defaultValue={test.passingScore}
                onBlur={(e) =>
                  updateTest.mutate({ passingScore: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                }
                className={`mt-1 ${field}`}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TestStatusPill status={test.status} />
            {test.status === "published" ? (
              <button
                onClick={() =>
                  updateTest.mutate(
                    { status: "draft" },
                    { onSuccess: () => toast.success("Тест снят с публикации") },
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
              >
                <Lock className="size-3.5" /> Снять с публикации
              </button>
            ) : (
              <button
                disabled={test.questions.length === 0 || updateTest.isPending}
                onClick={() =>
                  updateTest.mutate(
                    { status: "published" },
                    {
                      onSuccess: () => toast.success("Тест опубликован"),
                      onError: onApiError("Не удалось опубликовать тест"),
                    },
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
              >
                <Unlock className="size-3.5" /> Опубликовать
              </button>
            )}
            {actionsSlot && <span className="ml-auto">{actionsSlot}</span>}
            <button
              onClick={() => {
                if (!window.confirm("Удалить тест вместе со всеми вопросами?")) return;
                deleteTest.mutate(undefined, {
                  onSuccess: () => toast.success("Тест удалён"),
                  onError: onApiError("Не удалось удалить тест"),
                });
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-destructive ${actionsSlot ? "" : "ml-auto"}`}
            >
              <Trash2 className="size-3.5" /> Удалить тест
            </button>
          </div>

          <div className="space-y-3">
            {test.questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">
                    {qi + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      defaultValue={q.text}
                      onBlur={(e) => {
                        if (e.target.value !== q.text) updateQuestion.mutate({ questionId: q.id, text: e.target.value });
                      }}
                      placeholder="Текст вопроса"
                      className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion.mutate({ questionId: q.id, type: e.target.value as QuestionType })}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-bold outline-none"
                    >
                      <option value="single">Один правильный ответ</option>
                      <option value="multiple">Несколько правильных ответов</option>
                    </select>
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateOption.mutate({ optionId: o.id, isCorrect: !o.isCorrect })}
                            title="Отметить правильным"
                            className={`grid size-5 shrink-0 place-items-center border text-[10px] ${
                              q.type === "single" ? "rounded-full" : "rounded-[4px]"
                            } ${o.isCorrect ? "border-success bg-success text-white" : "border-input"}`}
                          >
                            {o.isCorrect && "✓"}
                          </button>
                          <input
                            defaultValue={o.text}
                            onBlur={(e) => {
                              if (e.target.value !== o.text) updateOption.mutate({ optionId: o.id, text: e.target.value });
                            }}
                            placeholder="Вариант ответа"
                            className="w-full min-w-0 flex-1 rounded-lg border border-input bg-surface px-2.5 py-2 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteQuestion.mutate(q.id, { onError: onApiError("Не удалось удалить вопрос") })}
                    aria-label="Удалить вопрос"
                    className="mt-2 shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addQuestion.mutate(undefined, { onError: onApiError("Не удалось добавить вопрос") })}
            disabled={addQuestion.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            <Plus className="size-3.5" /> Добавить вопрос
          </button>
        </>
      )}
    </section>
  );
}
