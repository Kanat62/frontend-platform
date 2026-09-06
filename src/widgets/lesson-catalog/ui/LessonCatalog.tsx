import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, ChevronRight, Clock3, Plus, Search, Video } from "lucide-react";
import { paths } from "@/shared/config";
import { EmptyState, SectionTitle } from "@/shared/ui";
import { useLessonCatalogQuery } from "@/entities/program";
import { CreateLessonModal } from "@/features/create-lesson";

// Порт «Уроки» (поиск + список) из curator.course.index.tsx (CuratorCourse).
export function LessonCatalog({ productId }: { productId: string }) {
  const catalog = useLessonCatalogQuery(productId);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const list = useMemo(
    () =>
      (catalog.data ?? []).filter((l) =>
        `${l.title} ${l.block}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [catalog.data, query],
  );

  // Блоки продукта (в порядке появления в каталоге) — для подсказок и дефолта
  // в форме создания урока. Новый урок по умолчанию попадает в последний блок.
  const blocks = useMemo(() => {
    const seen: string[] = [];
    for (const l of catalog.data ?? []) if (!seen.includes(l.block)) seen.push(l.block);
    return seen;
  }, [catalog.data]);
  const lastBlock = blocks.at(-1) ?? "";

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти урок"
          className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <SectionTitle title="Уроки" icon={BookOpen} />
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> Создать урок
        </button>
      </div>

      {creating && (
        <CreateLessonModal
          productId={productId}
          blocks={blocks}
          defaultBlock={lastBlock}
          onClose={() => setCreating(false)}
        />
      )}

      {catalog.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : catalog.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить уроки.{" "}
          <button onClick={() => catalog.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Search} title="Уроки не найдены" />
      ) : (
        <div className="surface-card divide-y divide-border overflow-hidden">
          {list.map((l) => (
            <Link
              key={l.order}
              to={paths.curator.lessonEditor(productId, l.order)}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/30"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-extrabold text-muted-foreground">
                {l.order}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{l.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Clock3 className="size-3 shrink-0" /> {l.duration} · {l.block}
                  {l.hasPractice && (
                    <>
                      {" "}
                      · <Video className="size-3 shrink-0" /> практика
                    </>
                  )}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
