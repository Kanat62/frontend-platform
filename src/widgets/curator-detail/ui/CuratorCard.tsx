import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, History, Lock, Users } from "lucide-react";
import { ApiError } from "@/shared/lib";
import { paths } from "@/shared/config";
import { Avatar, EmptyState, Pill, Select, SectionTitle } from "@/shared/ui";
import { LangPill } from "@/shared/ui";
import {
  CuratorZonePill,
  useAuditLogQuery,
  useCuratorQuery,
  type LanguageCode,
} from "@/entities/curator";
import { useUpdateCuratorMutation } from "@/features/edit-curator";
import { CuratorCredentials } from "@/features/reset-curator-password";

const ACTION_LABEL: Record<string, string> = {
  "student.create": "Создал ученика",
  "student.delete": "Удалил ученика",
  "student.access.update": "Изменил статус ученика",
  "student.bulk_update": "Массовое изменение учеников",
  "student.lesson.open": "Открыл урок ученику",
  "student.lesson.close": "Закрыл урок ученику",
  "student.note.add": "Добавил заметку",
  "group.teacher.assign": "Назначил преподавателя группе",
  "group.lesson.open": "Открыл урок группе",
  "group.lesson.close": "Закрыл урок группе",
  "meeting.attendance.mark": "Отметил посещаемость",
  "curator.create": "Создал куратора",
  "curator.update": "Изменил куратора",
  "curator.reset_password": "Сбросил пароль куратора",
  "curator.substitution.start": "Начал замещение",
  "curator.substitution.end": "Завершил замещение",
};

export function CuratorCard({ curatorId }: { curatorId: string }) {
  const curator = useCuratorQuery(curatorId);
  const update = useUpdateCuratorMutation(curatorId);
  const [page, setPage] = useState(1);
  const auditLog = useAuditLogQuery(curatorId, page);

  if (curator.isPending) {
    return (
      <div className="space-y-5">
        <BackLink />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }
  if (curator.isError) {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState icon={Lock} title="Куратор не найден" />
      </div>
    );
  }

  const c = curator.data;

  return (
    <div className="space-y-5 rise-in">
      <BackLink />

      <header className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={c.name} tone="var(--tone-2)" size="lg" />
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">{c.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">@{c.login}</span>
                <CuratorZonePill zone={c.zone} />
                {c.substitutionZone && <Pill tone="warning">🟠 Замещает {c.substitutionZone === "en" ? "English" : "Русский"}</Pill>}
                {c.disabled && <Pill tone="danger">Отключён</Pill>}
              </div>
            </div>
          </div>
          {!c.isMain && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                className="w-40"
                ariaLabel="Языковая зона"
                value={c.zone ?? ""}
                onChange={(v) => {
                  update.mutate(
                    { zone: v as LanguageCode },
                    {
                      onSuccess: () => toast.success("Зона обновлена"),
                      onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось обновить зону"),
                    },
                  );
                }}
                options={[
                  { value: "en", label: "English" },
                  { value: "ru", label: "Русский" },
                ]}
              />
              <button
                type="button"
                onClick={() => {
                  update.mutate(
                    { disabled: !c.disabled },
                    {
                      onSuccess: () => toast.success(c.disabled ? "Куратор включён" : "Куратор отключён"),
                      onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось изменить статус"),
                    },
                  );
                }}
                className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
              >
                {c.disabled ? "Включить" : "Отключить"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Группы", v: c.stats.groupsCount },
            { l: "Ученики", v: c.stats.studentsCount },
            { l: "Активные", v: c.stats.activeCount },
            { l: "В зоне риска", v: c.stats.atRiskCount },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <CuratorCredentials curatorId={c.id} login={c.login} />
        </div>
      </header>

      <section>
        <SectionTitle title="Группы" icon={GraduationCap} />
        {c.groups.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Групп нет" />
        ) : (
          <div className="surface-card divide-y divide-border overflow-hidden">
            {c.groups.map((g) => (
              <Link
                key={g.id}
                to={paths.curator.group(g.id)}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/60"
              >
                <span className="min-w-0 truncate text-sm font-bold">{g.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{g.studentCount} учеников</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Ученики" icon={Users} />
        {c.students.length === 0 ? (
          <EmptyState icon={Users} title="Учеников нет" />
        ) : (
          <div className="surface-card divide-y divide-border overflow-hidden">
            {c.students.slice(0, 20).map((s) => (
              <Link
                key={s.id}
                to={paths.curator.student(s.id)}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
              >
                <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {s.firstName} {s.lastName}
                </span>
                <LangPill code={s.language} />
              </Link>
            ))}
            {c.students.length > 20 && (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                И ещё {c.students.length - 20} — полный список на странице «Ученики».
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="История действий" icon={History} />
        {auditLog.isPending ? (
          <div className="h-32 animate-pulse rounded-3xl bg-muted/40" />
        ) : auditLog.isError || !auditLog.data || auditLog.data.items.length === 0 ? (
          <EmptyState icon={History} title="Действий пока нет" />
        ) : (
          <div className="space-y-2">
            <div className="surface-card divide-y divide-border overflow-hidden">
              {auditLog.data.items.map((e) => (
                <div key={e.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{ACTION_LABEL[e.action] ?? e.action}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("ru")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {e.zone && <LangPill code={e.zone} />}
                    {e.wasSubstitution && <Pill tone="warning">🟠 в режиме замещения</Pill>}
                  </div>
                </div>
              ))}
            </div>
            {auditLog.data.total > auditLog.data.pageSize && (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
                >
                  Назад
                </button>
                <span className="text-xs font-semibold text-muted-foreground">
                  {page} / {Math.ceil(auditLog.data.total / auditLog.data.pageSize)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(auditLog.data.total / auditLog.data.pageSize)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
                >
                  Вперёд
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={paths.curator.curators}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> К кураторам
    </Link>
  );
}
