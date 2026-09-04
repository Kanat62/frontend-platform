import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, CalendarClock, Lock, Unlock, Users } from "lucide-react";
import { toast } from "sonner";
import { ApiError, formatDate, formatFull, weekdayFull } from "@/shared/lib";
import { LESSON_COUNT, paths, TODAY } from "@/shared/config";
import { EmptyState, Pill, ProgressBar, SectionTitle, Select } from "@/shared/ui";
import { StudentAvatar } from "@/entities/student";
import { GroupStatusPill, useGroupQuery, type GroupStatus } from "@/entities/group";
import { useTeacherOptionsQuery } from "@/entities/teacher";
import { LessonAccessList } from "@/features/open-lesson-for-group";
import { useUpdateGroupMutation } from "@/features/edit-group";
import { useAssignTeacherToGroupMutation } from "@/features/assign-teacher-to-group";
import { ScheduleGroupMeetingForm } from "@/features/schedule-meeting";

function dayKindLabel(date: string): string {
  const idx = (new Date(date).getDay() + 6) % 7; // 0=Пн … 6=Вс
  if (idx === 6) return "Выходной";
  return idx % 2 === 0 ? "Теория" : "Практика";
}

// Порт GroupScreen из curator.groups.$id.tsx.
export function GroupDetail({ groupId }: { groupId: string }) {
  const group = useGroupQuery(groupId);
  const teachers = useTeacherOptionsQuery();
  const updateGroup = useUpdateGroupMutation(groupId);
  const assignTeacher = useAssignTeacherToGroupMutation(groupId);
  const [showStudents, setShowStudents] = useState(true);

  if (group.isPending) {
    return (
      <div className="space-y-5">
        <BackLink />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }
  if (group.isError) {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState icon={Lock} title="Группа не найдена" />
      </div>
    );
  }

  const g = group.data;
  const tomorrow = new Date(TODAY);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="space-y-5 overflow-x-hidden rise-in">
      <BackLink />

      <header className="surface-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold sm:text-2xl">{g.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {g.language === "en" ? "English" : "Русский"}
              </span>
              <GroupStatusPill status={g.status} />
              <Pill tone="neutral">
                {g.studentCount} / {g.maxStudents} учеников
              </Pill>
            </div>
          </div>
          <Select
            className="w-40"
            ariaLabel="Статус группы"
            value={g.status}
            onChange={(v) => {
              updateGroup.mutate({ status: v as GroupStatus }, { onSuccess: () => toast.success("Статус группы обновлён") });
            }}
            options={[
              { value: "recruiting", label: "Набор" },
              { value: "active", label: "Активна" },
              { value: "finished", label: "Завершена" },
              { value: "archived", label: "Архив" },
            ]}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Старт", v: formatFull(g.startDate) },
            { l: "Финиш", v: formatFull(g.endDate) },
            { l: "Практика", v: `${g.practiceStart}–${g.practiceEnd}` },
            { l: "Преподаватель", v: g.teacherName ?? "—" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="truncate text-sm font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="surface-card p-5">
        <SectionTitle title="Текущий этап группы" icon={BookOpen} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl gradient-primary px-3 py-2 text-sm font-extrabold text-primary-foreground">
            MONTH {g.month} · {g.level}
          </span>
          <span className="rounded-xl bg-muted px-3 py-2 text-sm font-bold">Lesson {g.lessonOrder}</span>
          <span className="text-sm font-semibold text-muted-foreground">Topic: {g.topic}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Это общий учебный этап группы — прогресс каждого ученика хранится отдельно.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">Сегодня ({weekdayFull(TODAY)})</p>
            <p className="text-sm font-extrabold">{dayKindLabel(TODAY)}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">Завтра</p>
            <p className="text-sm font-extrabold">{dayKindLabel(tomorrow.toISOString().slice(0, 10))}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Всего", v: g.health.total, tone: "neutral" as const },
          { l: "Активны", v: g.health.active, tone: "success" as const },
          { l: "At risk", v: g.health.atRisk, tone: "warning" as const },
          { l: "Не заходят", v: g.health.inactive, tone: "danger" as const },
        ].map((x) => (
          <div key={x.l} className="surface-card p-4">
            <Pill tone={x.tone}>{x.l}</Pill>
            <p className="mt-2 text-2xl font-extrabold">{x.v}</p>
          </div>
        ))}
      </section>

      <section className="surface-card p-5">
        <SectionTitle title="Доступ к урокам" icon={Unlock} />
        <p className="text-xs text-muted-foreground">
          Уроки и тесты готовятся на экране курса. Здесь доступ открывается этой группе по мере
          прохождения программы: открытие урока открывает все предыдущие, закрытие — все
          последующие. Открыто {Math.max(0, g.currentLesson)} / {LESSON_COUNT}.
        </p>
        <div className="mt-3">
          <LessonAccessList groupId={groupId} currentLesson={g.currentLesson} />
        </div>
      </section>

      <section className="surface-card p-5">
        <SectionTitle title="Расписание группы" icon={CalendarClock} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {g.weekSchedule.map((d) => (
            <div
              key={d.day}
              className={`rounded-xl p-3 text-center ${
                d.kind === "practice" ? "bg-primary-soft" : d.kind === "rest" ? "bg-muted/40" : "bg-muted/70"
              }`}
            >
              <p className="text-xs font-extrabold">{d.day}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                {d.kind === "practice" ? "Практика" : d.kind === "rest" ? "Выходной" : "Теория"}
              </p>
              {d.time && <p className="text-[10px] text-muted-foreground">{d.time}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <SectionTitle title="Преподаватель" />
        <label className="block text-xs font-semibold text-muted-foreground">
          Назначить / заменить
          <Select
            className="mt-1"
            ariaLabel="Назначить / заменить преподавателя"
            value={g.teacherId ?? ""}
            onChange={(v) => {
              assignTeacher.mutate(
                { teacherId: v || null },
                {
                  onSuccess: () => toast.success(v ? "Преподаватель назначен" : "Преподаватель снят"),
                  onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось назначить"),
                },
              );
            }}
            options={[
              { value: "", label: "— без преподавателя —" },
              ...(teachers.data ?? []).filter((t) => t.languages.includes(g.language)).map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Система не даёт назначить преподавателя в две группы с одинаковым вечерним слотом.
        </p>
      </section>

      <section className="surface-card p-5">
        <SectionTitle title="Практика группы" icon={CalendarClock} />
        <ScheduleGroupMeetingForm groupId={groupId} groupMeetUrl={g.meetUrl} />
        <label className="mt-3 block text-xs font-semibold text-muted-foreground">
          Постоянная ссылка Google Meet группы
          <input
            defaultValue={g.meetUrl}
            onBlur={(e) => {
              updateGroup.mutate({ meetUrl: e.target.value.trim() }, { onSuccess: () => toast.success("Ссылка группы сохранена") });
            }}
            placeholder="https://meet.google.com/…"
            className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <div className="mt-3 space-y-2">
          {g.recentMeetings.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="font-bold">{formatDate(m.date)}</span>
              <span className="text-muted-foreground">
                {m.startTime}–{m.endTime}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.title}</span>
              <Pill tone={m.status === "completed" ? "success" : m.status === "cancelled" ? "danger" : "primary"}>
                {m.status === "completed" ? "Проведена" : m.status === "cancelled" ? "Отменена" : "Запланирована"}
              </Pill>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title={`Ученики (${g.roster.length})`}
          icon={Users}
          action={
            <button onClick={() => setShowStudents((v) => !v)} className="text-xs font-bold text-primary">
              {showStudents ? "Свернуть" : "Показать"}
            </button>
          }
        />
        {showStudents &&
          (g.roster.length === 0 ? (
            <EmptyState icon={Users} title="В группе пока нет учеников" />
          ) : (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {g.roster.map((s) => (
                <Link
                  key={s.id}
                  to={paths.curator.student(s.id)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                >
                  <StudentAvatar firstName={s.firstName} lastName={s.lastName} avatarTone={s.avatarTone} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      урок {s.currentLessonOrder} · {s.progressPct}% · активность {formatDate(s.lastActivity)}
                    </p>
                    <ProgressBar value={s.progressPct} className="mt-1.5 h-1.5 max-w-48" />
                  </div>
                  {s.accessStatus !== "active" ? (
                    <Pill tone="warning">{s.accessStatus}</Pill>
                  ) : s.idleBucket === "inactive" ? (
                    <Pill tone="danger">Не заходит</Pill>
                  ) : s.idleBucket === "at_risk" ? (
                    <Pill tone="warning">At risk</Pill>
                  ) : (
                    <Pill tone="success">Активен</Pill>
                  )}
                </Link>
              ))}
            </div>
          ))}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={paths.curator.groups}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> К группам
    </Link>
  );
}
