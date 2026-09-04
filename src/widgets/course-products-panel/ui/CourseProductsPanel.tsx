import { Layers } from "lucide-react";
import { SectionTitle, LangPill } from "@/shared/ui";
import { useCourseProductsQuery } from "@/entities/course-product";
import { PreviewVideoPanel } from "@/features/set-preview-video";

// Порт «Продукты» + «Тестовое видео» из curator.course.index.tsx (CuratorCourse).
export function CourseProductsPanel() {
  const products = useCourseProductsQuery();

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle title="Продукты" icon={Layers} />
        {products.isPending ? (
          <div className="h-32 animate-pulse rounded-3xl bg-muted/40" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(products.data ?? []).map((c) => (
              <div key={c.id} className="surface-card space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold">{c.title}</p>
                  <LangPill code={c.language} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.format === "GROUP" ? "Групповой" : "Индивидуальный"} · {c.durationMonths} мес ·{" "}
                  {c.price.toLocaleString("ru")} {c.currency}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.features.map((feat) => (
                    <span key={feat} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {feat}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Программа: {c.levelPlan.map((p) => `M${p.month}→${p.level}`).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="surface-card flex items-start gap-3 p-4">
        <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          Здесь готовится общий контент курса — тексты уроков, видео и тесты. Доступ к урокам не
          выдаётся на этом экране: он открывается каждой группе отдельно на экране группы.
        </p>
      </div>

      <PreviewVideoPanel />
    </div>
  );
}
