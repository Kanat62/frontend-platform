import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, GraduationCap, Lock } from "lucide-react";
import { ApiError } from "@/shared/lib";
import { paths } from "@/shared/config";
import { EmptyState, Pill, Select, SectionTitle } from "@/shared/ui";
import { StudentAvatar } from "@/entities/student";
import { GroupStatusPill } from "@/entities/group";
import { Avatar, LangPill } from "@/shared/ui";
import {
  TeacherStatusPill,
  useTeacherOptionsQuery,
  useTeacherQuery,
  type TeacherGroup,
  type TeacherOption,
  type TeacherStatus,
} from "@/entities/teacher";
import { useUpdateTeacherStatusMutation } from "@/features/edit-teacher-status";
import { useAssignTeacherToGroupMutation } from "@/features/assign-teacher-to-group";
import { DeleteTeacherButton } from "@/features/delete-teacher";

// Порт TeacherCard из curator.teachers.$id.tsx.
export function TeacherCard({ teacherId }: { teacherId: string }) {
  const teacher = useTeacherQuery(teacherId);
  const allTeachers = useTeacherOptionsQuery();
  const updateStatus = useUpdateTeacherStatusMutation(teacherId);

  if (teacher.isPending) {
    return (
      <div className="space-y-5">
        <BackLink />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }
  if (teacher.isError) {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState icon={Lock} title="Преподаватель не найден" />
      </div>
    );
  }

  const t = teacher.data;
  const otherTeachers = (allTeachers.data ?? []).filter((x) => x.id !== t.id);

  return (
    <div className="space-y-5 rise-in">
      <BackLink />

      <header className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={t.name} tone={t.tone} size="lg" />
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">{t.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {t.languages.map((l) => (
                  <LangPill key={l} code={l} />
                ))}
                <TeacherStatusPill status={t.status} />
              </div>
            </div>
          </div>
          <Select
            className="w-40"
            ariaLabel="Статус"
            value={t.status}
            onChange={(v) => {
              updateStatus.mutate(
                { status: v as TeacherStatus },
                {
                  onSuccess: () => toast.success("Статус обновлён"),
                  onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось обновить статус"),
                },
              );
            }}
            options={[
              { value: "active", label: "Активна" },
              { value: "absent", label: "Отсутствует" },
              { value: "replacement", label: "Нужна замена" },
            ]}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Группы", v: t.stats.groupsCount },
            { l: "Ученики в группах", v: t.stats.groupStudents },
            { l: "Individual", v: t.stats.individualsCount },
            { l: "Практик сегодня", v: t.stats.practicesToday },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <DeleteTeacherButton teacherId={t.id} name={t.name} />
        </div>
      </header>

      <section>
        <SectionTitle title="Группы преподавателя" icon={GraduationCap} />
        {t.groups.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Группы не назначены" />
        ) : (
          <div className="space-y-3">
            {t.groups.map((g) => (
              <TeacherGroupRow key={g.id} group={g} candidates={otherTeachers.filter((x) => x.languages.includes(g.language))} />
            ))}
          </div>
        )}
      </section>

      {t.individuals.length > 0 && (
        <section>
          <SectionTitle title="Индивидуальные ученики" icon={CalendarClock} />
          <div className="surface-card divide-y divide-border overflow-hidden">
            {t.individuals.map((s) => (
              <Link
                key={s.id}
                to={paths.curator.student(s.id)}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
              >
                <StudentAvatar firstName={s.firstName} lastName={s.lastName} avatarTone={s.avatarTone} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {s.firstName} {s.lastName}
                </span>
                <LangPill code={s.language} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TeacherGroupRow({ group, candidates }: { group: TeacherGroup; candidates: TeacherOption[] }) {
  const assignTeacher = useAssignTeacherToGroupMutation(group.id);

  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={paths.curator.group(group.id)} className="min-w-0 text-sm font-extrabold hover:text-primary">
          {group.name}
        </Link>
        <GroupStatusPill status={group.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Pill tone="neutral">
          {group.practiceStart}–{group.practiceEnd}
        </Pill>
        <span>
          {group.studentCount}/{group.maxStudents} · Month {group.month} · {group.level}
        </span>
      </div>
      <label className="mt-3 block text-xs font-semibold text-muted-foreground">
        Заменить преподавателя
        <Select
          className="mt-1"
          ariaLabel="Заменить преподавателя"
          value=""
          placeholder="— выбрать замену —"
          onChange={(id) => {
            if (!id) return;
            assignTeacher.mutate(
              { teacherId: id },
              {
                onSuccess: () => toast.success("Преподаватель заменён — расписание проверено"),
                onError: (error) =>
                  toast.error(error instanceof ApiError ? error.message : "Не удалось заменить преподавателя"),
              },
            );
          }}
          options={candidates.map((x) => ({ value: x.id, label: x.name }))}
        />
      </label>
    </div>
  );
}

function BackLink() {
  return (
    <Link to={paths.curator.teachers} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> К преподавателям
    </Link>
  );
}
