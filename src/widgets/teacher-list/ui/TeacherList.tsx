import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, Presentation } from "lucide-react";
import { paths } from "@/shared/config";
import { Avatar, EmptyState, LangPill, SectionTitle } from "@/shared/ui";
import { formatDate } from "@/shared/lib";
import { TeacherStatusPill, useTeachersQuery } from "@/entities/teacher";
import { CreateTeacherModal } from "@/features/create-teacher";

// Порт TeachersPage из curator.teachers.index.tsx.
export function TeacherList() {
  const [searchParams] = useSearchParams();
  const teachers = useTeachersQuery();
  const [open, setOpen] = useState(Boolean(searchParams.get("new")));

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Преподаватели</h1>
          <p className="mt-1 text-sm text-muted-foreground">{teachers.data?.items.length ?? 0} всего</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Добавить преподавателя</span>
        </button>
      </header>

      {teachers.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : teachers.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить преподавателей.{" "}
          <button onClick={() => teachers.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Активны", v: teachers.data.summary.active },
              { l: "Отсутствуют", v: teachers.data.summary.absent },
              { l: "Нужна замена", v: teachers.data.summary.replacement },
              { l: "Практик сегодня", v: teachers.data.summary.practicesToday },
            ].map((x) => (
              <div key={x.l} className="surface-card p-4">
                <p className="text-2xl font-extrabold">{x.v}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>

          <SectionTitle title="Список" icon={Presentation} />
          {teachers.data.items.length === 0 ? (
            <EmptyState icon={Presentation} title="Преподавателей нет" />
          ) : (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {teachers.data.items.map((t) => (
                <Link
                  key={t.id}
                  to={paths.curator.teacher(t.id)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
                >
                  <Avatar name={t.name} tone={t.tone} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{t.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {t.languages.map((l) => (
                        <LangPill key={l} code={l} />
                      ))}
                      <span>
                        · {t.groupsCount} групп · {t.studentsCount} учеников
                        {t.nextPracticeDate ? ` · ближайшая ${formatDate(t.nextPracticeDate)}` : ""}
                      </span>
                    </p>
                  </div>
                  <TeacherStatusPill status={t.status} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {open && <CreateTeacherModal onClose={() => setOpen(false)} />}
    </div>
  );
}
