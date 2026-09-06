import { Link } from "react-router";
import { ChevronRight, Layers } from "lucide-react";
import { paths } from "@/shared/config";
import { SectionTitle, LangPill } from "@/shared/ui";
import { useCourseProductsQuery } from "@/entities/course-product";

// Порт «Продукты» из curator.course.index.tsx (CuratorCourse). Каждая карточка
// ведёт на экран уроков именно этой категории (§4.1/§4.2 TЗ) — у каждой свой контент.
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
              <Link
                key={c.id}
                to={paths.curator.courseProduct(c.id)}
                className="surface-card space-y-2 p-4 transition hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold">{c.title}</p>
                  <LangPill code={c.language} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.format === "GROUP" ? "Групповой" : "Индивидуальный"} · {c.durationMonths} мес
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.features.map((feat) => (
                    <span key={feat} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {feat}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <p className="text-[11px] text-muted-foreground">
                    Программа: {c.levelPlan.map((p) => `M${p.month}→${p.level}`).join(" · ")}
                  </p>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
