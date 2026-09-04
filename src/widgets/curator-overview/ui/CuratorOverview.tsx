import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  LinkIcon,
  Plus,
  Presentation,
  UserPlus,
  Users,
} from "lucide-react";
import { paths } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import { EmptyState, SectionTitle } from "@/shared/ui";
import { StudentAvatar } from "@/entities/student";
import { useCuratorDashboardQuery } from "../api/queries";

const QUICK_ACTIONS = [
  { to: `${paths.curator.students}?new=1`, label: "Добавить ученика", icon: UserPlus },
  { to: `${paths.curator.groups}?new=1`, label: "Создать группу", icon: GraduationCap },
  { to: `${paths.curator.teachers}?new=1`, label: "Добавить преподавателя", icon: Presentation },
  { to: `${paths.curator.schedule}?new=1`, label: "Создать практику", icon: CalendarClock },
] as const;

// Порт CuratorDashboard из curator.index.tsx.
export function CuratorOverview() {
  const { data, isPending, isError, refetch } = useCuratorDashboardQuery();

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить дашборд.{" "}
        <button onClick={() => refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const stats = [
    { label: "Ученики", value: data.stats.students, icon: Users },
    { label: "Активные", value: data.stats.active, icon: CheckCircle2 },
    { label: "Группы", value: data.stats.groups, icon: GraduationCap },
    { label: "Преподаватели", value: data.stats.teachers, icon: Presentation },
  ];

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Добро пожаловать, {data.curatorName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Сегодня · {formatDate(data.today)}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface-card p-4">
            <s.icon className="size-4 text-primary" />
            <p className="mt-3 text-2xl font-extrabold">{s.value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="surface-card p-5">
        <SectionTitle title="Сегодня" icon={CalendarClock} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Практика", v: `${data.todayPracticeGroupsCount} групп`, to: paths.curator.schedule },
            { l: "Новые ученики", v: `${data.newStudentsCount}`, to: paths.curator.students },
            { l: "Требуют внимания", v: `${data.attentionCount}`, to: paths.curator.students },
          ].map((x) => (
            <Link key={x.l} to={x.to} className="rounded-xl bg-muted/70 p-3 transition hover:bg-muted">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Быстрые действия" icon={Plus} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="surface-card flex flex-col items-start gap-3 p-4 transition hover:border-primary"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                <a.icon className="size-4" />
              </span>
              <span className="text-xs font-bold leading-snug">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Требует внимания" icon={AlertTriangle} />
        {data.attentionRows.length ? (
          <div className="surface-card divide-y divide-border overflow-hidden">
            {data.attentionRows.map((r) => (
              <Link
                key={r.label}
                to={r.to === "students" ? paths.curator.students : paths.curator.groups}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warning-soft text-warning">
                  <AlertTriangle className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{r.label}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={CheckCircle2} title="Всё под контролем" />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Практика сегодня" icon={CalendarClock} />
          {data.todayMeetings.length ? (
            <div className="space-y-2.5">
              {data.todayMeetings.map((m) => (
                <div key={m.id} className="surface-card flex items-center gap-3 p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <CalendarClock className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.startTime}–{m.endTime} · {m.groupName ?? "Individual"}
                    </p>
                  </div>
                  {m.meetUrl ? (
                    <a
                      href={m.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                    >
                      Meet
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                      <LinkIcon className="size-3.5" /> нет ссылки
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarClock} title="Сегодня практик нет" />
          )}
        </section>

        <section>
          <SectionTitle title="Ученики без активности" icon={AlertTriangle} />
          {data.idleStudents.length ? (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {data.idleStudents.map((s) => (
                <Link
                  key={s.id}
                  to={paths.curator.student(s.id)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                >
                  <StudentAvatar firstName={s.firstName} lastName={s.lastName} avatarTone={s.avatarTone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">Последняя активность: {formatDate(s.lastActivity)}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="Все ученики активны" />
          )}
        </section>
      </div>
    </div>
  );
}
