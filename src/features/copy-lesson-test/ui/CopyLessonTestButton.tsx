import { useMemo, useState } from "react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { qk } from "@/shared/api";
import { ApiError, cn } from "@/shared/lib";
import { LangPill, Modal } from "@/shared/ui";
import { useQueryClient } from "@tanstack/react-query";
import { TestStatusPill } from "@/entities/lesson-test";
import { useCourseProductsQuery } from "@/entities/course-product";
import { useTestLibraryQuery } from "../model/useTestLibraryQuery";
import { useCopyLessonTestMutation } from "../model/useCopyLessonTestMutation";
import type { TestLibraryItem } from "../model/types";

/**
 * «Взять тест из другого курса» — копирует в тест текущего урока вопросы и
 * варианты теста другого урока (напр. одинаковые уроки 3- и 6-месячного курса).
 * В отличие от видео это копия: после переноса тесты независимы. В списке
 * доноров — только курсы того же языка обучения, что и текущий.
 */
export function CopyLessonTestButton({
  productId,
  lessonId,
  hasExistingTest,
}: {
  productId: string;
  lessonId: string;
  /** true, если у урока уже есть тест — тогда его вопросы будут заменены. */
  hasExistingTest: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-muted"
      >
        <Copy className="size-3.5" />
        Взять тест из другого курса
      </button>
      {open && (
        <CopyTestModal
          productId={productId}
          lessonId={lessonId}
          hasExistingTest={hasExistingTest}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CopyTestModal({
  productId,
  lessonId,
  hasExistingTest,
  onClose,
}: {
  productId: string;
  lessonId: string;
  hasExistingTest: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const products = useCourseProductsQuery();
  const library = useTestLibraryQuery();
  const copy = useCopyLessonTestMutation(lessonId);
  const [selected, setSelected] = useState<TestLibraryItem | null>(null);

  const currentLanguage = products.data?.find((p) => p.id === productId)?.language;

  const groups = useMemo(() => {
    // Только курсы того же языка обучения; свой же тест из списка убираем.
    const items = (library.data ?? []).filter(
      (it) => it.lessonId !== lessonId && it.language === currentLanguage,
    );
    const byProduct = new Map<string, TestLibraryItem[]>();
    for (const it of items) {
      const list = byProduct.get(it.productId) ?? [];
      list.push(it);
      byProduct.set(it.productId, list);
    }
    return [...byProduct.values()]
      .map((list) => ({ product: list[0], tests: [...list].sort((a, b) => a.lessonOrder - b.lessonOrder) }))
      .sort((a, b) => {
        if (a.product.durationMonths !== b.product.durationMonths)
          return a.product.durationMonths - b.product.durationMonths;
        return a.product.productTitle.localeCompare(b.product.productTitle);
      });
  }, [library.data, lessonId, currentLanguage]);

  const submit = () => {
    if (!selected) return;
    copy.mutate(
      { sourceLessonId: selected.lessonId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: qk.tests.editor(lessonId) });
          toast.success("Тест скопирован — вопросы перенесены из урока-донора");
          onClose();
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось скопировать тест"),
      },
    );
  };

  const languageReady = Boolean(currentLanguage);
  const isEmpty = languageReady && !library.isPending && !library.isError && groups.length === 0;

  return (
    <Modal onClose={onClose} scrollable>
      <div className="w-full max-w-lg rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Взять тест из другого курса</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Вопросы и варианты выбранного теста скопируются в этот урок.{" "}
          {hasExistingTest
            ? "Текущие вопросы этого теста будут заменены."
            : "Тест этого урока будет создан автоматически."}{" "}
          После копирования тесты независимы.
        </p>

        <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {!languageReady || library.isPending ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          ) : library.isError ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Не удалось загрузить список тестов.
            </p>
          ) : isEmpty ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              В курсах того же языка ещё нет ни одного теста с вопросами, который можно переиспользовать.
            </p>
          ) : (
            groups.map(({ product, tests }) => (
              <section key={product.productId} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold">{product.productTitle}</span>
                  <LangPill code={product.language} />
                  <span className="text-[11px] text-muted-foreground">{product.durationMonths} мес</span>
                </div>
                <div className="space-y-1">
                  {tests.map((it) => {
                    const active = selected?.testId === it.testId;
                    return (
                      <button
                        key={it.testId}
                        type="button"
                        onClick={() => setSelected(it)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                          active ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-muted",
                        )}
                      >
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Урок {it.lessonOrder}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{it.testTitle}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {it.questionCount} вопр.
                        </span>
                        <TestStatusPill status={it.status} />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!selected || copy.isPending}
            onClick={submit}
            className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {copy.isPending ? "Копирование…" : "Скопировать тест"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
