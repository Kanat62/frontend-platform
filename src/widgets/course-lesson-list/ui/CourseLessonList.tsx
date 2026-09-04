import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { LessonRow, useLessonsQuery } from "@/entities/lesson";
import type { CourseBlock } from "@/entities/program";
import { useCourseQuery } from "../api/queries";
import { filterLessons, groupByBlock, LESSON_FILTERS, type LessonFilterId } from "../model/filter";
import { TestRow } from "./TestRow";

// Порт CoursePage из english-flow/src/routes/learn.tsx.
export function CourseLessonList() {
  const course = useCourseQuery();
  const lessons = useLessonsQuery();
  const [filter, setFilter] = useState<LessonFilterId>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(
    () => filterLessons(lessons.data ?? [], filter, query),
    [lessons.data, filter, query],
  );
  const grouped = useMemo(() => groupByBlock(list), [list]);

  if (lessons.isPending || course.isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (lessons.isError || course.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить курс.{" "}
        <button
          onClick={() => {
            void lessons.refetch();
            void course.refetch();
          }}
          className="font-bold text-primary hover:underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Курс {course.data.language === "en" ? "English" : "Русский"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {course.data.completed} из {course.data.total} уроков завершено ·{" "}
          {course.data.total ? Math.round((course.data.completed / course.data.total) * 100) : 0}%
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти тему"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {LESSON_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f.id
                  ? "gradient-primary text-primary-foreground"
                  : "border border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <EmptyState icon={Search} title="Ничего не найдено" description="Измените фильтр или запрос." />
      )}

      {grouped.map(([block, blockLessons]) => {
        const blockInfo: CourseBlock | undefined = course.data.blocks.find((b) => b.block === block);
        const level = blockInfo?.level;
        return (
          <section key={block}>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {level ? `${level} · ${block}` : block}
            </h2>
            <div className="surface-card divide-y divide-border overflow-hidden">
              {blockLessons.map((lesson) => (
                <div key={lesson.order}>
                  <LessonRow lesson={lesson} current={lesson.order === course.data.currentLessonOrder} />
                  <TestRow order={lesson.order} test={lesson.test} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
