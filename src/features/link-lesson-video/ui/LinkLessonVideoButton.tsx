import { useMemo, useState } from "react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/api";
import { ApiError, cn, formatDuration } from "@/shared/lib";
import { LangPill, Modal, Pill } from "@/shared/ui";
import { useCourseProductsQuery } from "@/entities/course-product";
import { useVideoLibraryQuery } from "../model/useVideoLibraryQuery";
import { useLinkLessonVideoMutation } from "../model/useLinkLessonVideoMutation";
import type { VideoLibraryItem } from "../model/types";

/**
 * «Взять видео из другого курса» — привязывает к текущему уроку видео другого
 * урока (напр. EN Group-6мес → урок EN Group-3мес) без повторной заливки в
 * Bunny. Оба урока указывают на один GUID; повторная замена видео на одном из
 * них снова их разводит.
 */
export function LinkLessonVideoButton({
  productId,
  order,
  disabled,
}: {
  productId: string;
  order: number;
  /** true, пока идёт заливка своего видео — чтобы не смешивать два действия. */
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-muted disabled:opacity-60"
      >
        <Link2 className="size-3.5" />
        Взять видео из другого курса
      </button>
      {open && (
        <LinkVideoModal productId={productId} order={order} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function LinkVideoModal({
  productId,
  order,
  onClose,
}: {
  productId: string;
  order: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const products = useCourseProductsQuery();
  const library = useVideoLibraryQuery();
  const link = useLinkLessonVideoMutation(productId, order);
  const [selected, setSelected] = useState<VideoLibraryItem | null>(null);

  const currentLanguage = products.data?.find((p) => p.id === productId)?.language;

  const groups = useMemo(() => {
    // Только курсы того же языка обучения (EN не показывает RU и наоборот); свой
    // же урок из списка убираем.
    const items = (library.data ?? []).filter(
      (it) => it.language === currentLanguage && !(it.productId === productId && it.order === order),
    );
    const byProduct = new Map<string, VideoLibraryItem[]>();
    for (const it of items) {
      const list = byProduct.get(it.productId) ?? [];
      list.push(it);
      byProduct.set(it.productId, list);
    }
    return [...byProduct.values()]
      .map((list) => ({
        product: list[0],
        lessons: [...list].sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => {
        // По длительности курса, затем по названию.
        if (a.product.durationMonths !== b.product.durationMonths)
          return a.product.durationMonths - b.product.durationMonths;
        return a.product.productTitle.localeCompare(b.product.productTitle);
      });
  }, [library.data, productId, order, currentLanguage]);

  const submit = () => {
    if (!selected) return;
    link.mutate(
      { sourceProductId: selected.productId, sourceOrder: selected.order },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: qk.lessons.editor(productId, order) });
          toast.success("Видео привязано — то же, что в уроке-доноре");
          onClose();
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "Не удалось привязать видео"),
      },
    );
  };

  const languageReady = Boolean(currentLanguage);
  const isEmpty = languageReady && !library.isPending && !library.isError && groups.length === 0;

  return (
    <Modal onClose={onClose} scrollable>
      <div className="w-full max-w-lg rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Взять видео из другого курса</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Видео не загрузится заново — этот урок и урок-донор будут показывать один и тот же файл.
        </p>

        <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {!languageReady || library.isPending ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          ) : library.isError ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Не удалось загрузить список видео.
            </p>
          ) : isEmpty ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              В курсах того же языка ещё нет загруженного видео, которое можно переиспользовать.
            </p>
          ) : (
            groups.map(({ product, lessons }) => (
              <section key={product.productId} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold">{product.productTitle}</span>
                  <LangPill code={product.language} />
                  <span className="text-[11px] text-muted-foreground">
                    {product.durationMonths} мес
                  </span>
                </div>
                <div className="space-y-1">
                  {lessons.map((it) => {
                    const active = selected?.lessonId === it.lessonId;
                    return (
                      <button
                        key={it.lessonId}
                        type="button"
                        onClick={() => setSelected(it)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-surface hover:bg-muted",
                        )}
                      >
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Урок {it.order}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {it.lessonTitle}
                        </span>
                        {it.videoStatus === "processing" && <Pill tone="warning">обработка</Pill>}
                        {it.videoStatus === "failed" && <Pill tone="danger">ошибка</Pill>}
                        {it.videoDurationSec != null && it.videoStatus === "ready" && (
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {formatDuration(it.videoDurationSec)}
                          </span>
                        )}
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
            disabled={!selected || link.isPending}
            onClick={submit}
            className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {link.isPending ? "Привязка…" : "Привязать видео"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
