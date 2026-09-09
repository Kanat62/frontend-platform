import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, Search, Users } from "lucide-react";
import { PAGE_SIZE, paths } from "@/shared/config";
import { formatFull } from "@/shared/lib";
import { EmptyState, Pill, ProgressBar, Select } from "@/shared/ui";
import { AccessPill, PaymentPill, StudentAvatar } from "@/entities/student";
import { useGroupsQuery } from "@/entities/group";
import { useTeacherOptionsQuery } from "@/entities/teacher";
import { useStudentsQuery } from "@/entities/student";
import { CreateStudentModal } from "@/features/create-student";
import { useStudentFilters } from "../model/useStudentFilters";
import { BulkActionBar } from "./BulkActionBar";

// Порт StudentsPage из curator.students.index.tsx.
export function StudentsTable() {
  const [searchParams] = useSearchParams();
  const [filters, updateFilters] = useStudentFilters();
  const students = useStudentsQuery(filters);
  const groups = useGroupsQuery("all", "all");
  const teachers = useTeacherOptionsQuery();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(Boolean(searchParams.get("new")));
  const [queryDraft, setQueryDraft] = useState(filters.q);

  // Выбор ограничен видимой странице — сбрасываем при её смене (BulkActionBar).
  useEffect(() => setSelected(new Set()), [filters.page]);
  useEffect(() => setQueryDraft(filters.q), [filters.q]);

  const rows = students.data?.items ?? [];
  const total = students.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOnPageSelected = rows.length > 0 && rows.every((s) => selected.has(s.id));
  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((s) => next.delete(s.id));
      else rows.forEach((s) => next.add(s.id));
      return next;
    });

  return (
    <div className="space-y-5 rise-in lg:ml-[calc(50%-50vw+8.75rem)] lg:w-[calc(100vw-17.5rem)]">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Ученики</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} учеников · страница {filters.page}/{pageCount}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Добавить ученика</span>
        </button>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            onBlur={() => updateFilters({ q: queryDraft })}
            onKeyDown={(e) => e.key === "Enter" && updateFilters({ q: queryDraft })}
            placeholder="Поиск по имени, логину или телефону"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Select
            ariaLabel="Язык"
            value={filters.language}
            onChange={(v) => updateFilters({ language: v as never })}
            options={[
              { value: "all", label: "Все языки" },
              { value: "en", label: "English" },
              { value: "ru", label: "Русский" },
            ]}
          />
          <Select
            ariaLabel="Формат"
            value={filters.type}
            onChange={(v) => updateFilters({ type: v as never })}
            options={[
              { value: "all", label: "Group + Individual" },
              { value: "GROUP", label: "Group" },
              { value: "INDIVIDUAL", label: "Individual" },
            ]}
          />
          <Select
            ariaLabel="Доступ"
            value={filters.status}
            onChange={(v) => updateFilters({ status: v as never })}
            options={[
              { value: "all", label: "Любой доступ" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
            ]}
          />
          <Select
            ariaLabel="Группа"
            value={filters.groupId}
            onChange={(v) => updateFilters({ groupId: v })}
            options={[
              { value: "all", label: "Все группы" },
              ...(groups.data?.items ?? []).map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
          <Select
            ariaLabel="Преподаватель"
            value={filters.teacherId}
            onChange={(v) => updateFilters({ teacherId: v })}
            options={[
              { value: "all", label: "Все преподаватели" },
              ...(teachers.data ?? []).map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <BulkActionBar ids={[...selected]} rows={rows} onClear={() => setSelected(new Set())} />
      )}

      {/* Данные предыдущей выборки остаются на экране, пока едет новая (keepPreviousData) —
          тонкая полоса вместо полного скелетона сообщает, что идёт обновление. */}
      {students.isPlaceholderData && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}

      {students.isPending ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      ) : students.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить учеников.{" "}
          <button onClick={() => students.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="Учеников не найдено" description="Измените фильтр или поиск." />
      ) : (
        <>
          <div className="surface-card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                  </th>
                  <th className="px-3 py-3">Ученик</th>
                  <th className="px-3 py-3">Курс</th>
                  <th className="px-3 py-3">Формат</th>
                  <th className="px-3 py-3">Группа</th>
                  <th className="px-3 py-3">Начало курса</th>
                  <th className="px-3 py-3">Конец курса</th>
                  <th className="px-3 py-3">Урок</th>
                  <th className="px-3 py-3">Прогресс</th>
                  <th className="px-3 py-3">Оплата</th>
                  <th className="px-3 py-3">Посл. активность</th>
                  <th className="px-3 py-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id} className="transition hover:bg-muted/50">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <Link to={paths.curator.student(s.id)} className="flex items-center gap-3">
                        <StudentAvatar firstName={s.firstName} lastName={s.lastName} avatarTone={s.avatarTone} size="sm" />
                        <span>
                          <span className="block font-bold">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="block text-xs text-muted-foreground">@{s.login}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold">{s.productTitle}</td>
                    <td className="px-3 py-3">
                      <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                        {s.type === "GROUP" ? "Group" : "Individual"}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold">{s.groupCode ?? "—"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatFull(s.startDate)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatFull(s.endDate)}</td>
                    <td className="px-3 py-3 font-semibold">
                      {s.currentLessonOrder}/{s.lessonsTotal}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.progressPct} className="w-20" />
                        <span className="text-xs font-bold">{s.progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentPill status={s.payment.status} />
                        {s.payment.status !== "full" && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {s.payment.total ? Math.round((s.payment.paid / s.payment.total) * 100) : 0}% ·{" "}
                            {s.payment.paid.toLocaleString("ru")} {s.payment.currency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatFull(s.lastActivity)}</td>
                    <td className="px-3 py-3">
                      <AccessPill status={s.accessStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {rows.map((s) => (
              <div key={s.id} className="surface-card flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="size-4 shrink-0"
                />
                <Link to={paths.curator.student(s.id)} className="flex min-w-0 flex-1 items-center gap-3">
                  <StudentAvatar firstName={s.firstName} lastName={s.lastName} avatarTone={s.avatarTone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.productTitle} · урок {s.currentLessonOrder}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatFull(s.startDate)} – {formatFull(s.endDate)}
                    </p>
                    <ProgressBar value={s.progressPct} className="mt-2 h-1.5" />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <AccessPill status={s.accessStatus} />
                      <PaymentPill status={s.payment.status} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
              disabled={filters.page === 1}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
            >
              Назад
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              {filters.page} / {pageCount}
            </span>
            <button
              onClick={() => updateFilters({ page: Math.min(pageCount, filters.page + 1) })}
              disabled={filters.page === pageCount}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </>
      )}

      {open && <CreateStudentModal onClose={() => setOpen(false)} />}
    </div>
  );
}
