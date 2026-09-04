import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { GraduationCap, Plus } from "lucide-react";
import { paths } from "@/shared/config";
import { Avatar, EmptyState, LangPill, Select } from "@/shared/ui";
import { GroupStatusPill, useGroupsQuery } from "@/entities/group";
import { CreateGroupModal } from "@/features/create-group";
import { useGroupFilters } from "../model/useGroupFilters";

// Порт GroupsPage из curator.groups.index.tsx.
export function GroupList() {
  const [searchParams] = useSearchParams();
  const [filters, updateFilters] = useGroupFilters();
  const groups = useGroupsQuery(filters.status, filters.language);
  const [open, setOpen] = useState(Boolean(searchParams.get("new")));

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Группы</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(groups.data?.byLanguage ?? []).map((b) => `${b.name} · ${b.count}`).join("   ·   ")}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Создать группу</span>
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          ariaLabel="Статус"
          value={filters.status}
          onChange={(v) => updateFilters({ status: v })}
          options={[
            { value: "all", label: "Любой статус" },
            { value: "recruiting", label: "Набор" },
            { value: "active", label: "Активные" },
            { value: "finished", label: "Завершены" },
            { value: "archived", label: "Архив" },
          ]}
        />
        <Select
          ariaLabel="Язык"
          value={filters.language}
          onChange={(v) => updateFilters({ language: v })}
          options={[
            { value: "all", label: "Все языки" },
            { value: "en", label: "English" },
            { value: "ru", label: "Русский" },
          ]}
        />
      </div>

      {groups.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : groups.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить группы.{" "}
          <button onClick={() => groups.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : groups.data.items.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Групп не найдено" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.data.items.map((g) => (
            <Link
              key={g.id}
              to={paths.curator.group(g.id)}
              className="surface-card space-y-3 p-4 transition hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{g.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {g.startDate} → {g.endDate} · практика {g.practiceStart}–{g.practiceEnd}
                  </p>
                </div>
                <GroupStatusPill status={g.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LangPill code={g.language} />
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  {g.studentCount} / {g.maxStudents} учеников
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  Month {g.month} · {g.level} · Lesson {g.lessonOrder}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {g.teacherName ? (
                  <>
                    <Avatar name={g.teacherName} tone={g.teacherTone ?? undefined} size="sm" />
                    <span className="font-bold">{g.teacherName}</span>
                  </>
                ) : (
                  <span className="font-bold text-warning">⚠ Без преподавателя</span>
                )}
                {!g.hasMeetUrl && (g.status === "active" || g.status === "recruiting") && (
                  <span className="font-bold text-warning">· ⚠ Без ссылки</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && <CreateGroupModal onClose={() => setOpen(false)} />}
    </div>
  );
}
