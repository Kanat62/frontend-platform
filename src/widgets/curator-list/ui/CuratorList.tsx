import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, ShieldCheck, Users } from "lucide-react";
import { paths } from "@/shared/config";
import { Avatar, EmptyState, Pill, SectionTitle } from "@/shared/ui";
import { CuratorZonePill, useCuratorsQuery } from "@/entities/curator";
import { CreateCuratorModal } from "@/features/create-curator";

// Список кураторов — только главный куратор (ТЗ «роли», страница «Кураторы»).
export function CuratorList() {
  const [searchParams] = useSearchParams();
  const curators = useCuratorsQuery();
  const [open, setOpen] = useState(Boolean(searchParams.get("new")));

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Кураторы</h1>
          <p className="mt-1 text-sm text-muted-foreground">{curators.data?.items.length ?? 0} всего</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Добавить куратора</span>
        </button>
      </header>

      {curators.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : curators.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить кураторов.{" "}
          <button onClick={() => curators.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Всего", v: curators.data.summary.total },
              { l: "Активны", v: curators.data.summary.active },
              { l: "В замещении", v: curators.data.summary.inSubstitution },
            ].map((x) => (
              <div key={x.l} className="surface-card p-4">
                <p className="text-2xl font-extrabold">{x.v}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>

          <SectionTitle title="Список" icon={ShieldCheck} />
          {curators.data.items.length === 0 ? (
            <EmptyState icon={Users} title="Кураторов нет" />
          ) : (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {curators.data.items.map((c) => (
                <Link
                  key={c.id}
                  to={paths.curator.curatorDetail(c.id)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
                >
                  <Avatar name={c.name} tone="var(--tone-2)" size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>@{c.login}</span>
                      <span>
                        · {c.groupsCount} групп · {c.studentsCount} учеников
                        {c.atRiskCount > 0 ? ` · ${c.atRiskCount} в зоне риска` : ""}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <CuratorZonePill zone={c.zone} />
                    {c.substitutionZone && <Pill tone="warning">🟠 Замещает</Pill>}
                    {c.disabled && <Pill tone="danger">Отключён</Pill>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {open && <CreateCuratorModal onClose={() => setOpen(false)} />}
    </div>
  );
}
