import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Lock, Search, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/shared/config";
import { ApiError, formatDate } from "@/shared/lib";
import { EmptyState, SectionTitle } from "@/shared/ui";
import {
  AttendanceStatusPill,
  useMeetingAuditLogQuery,
  useMeetingJournalQuery,
  type JournalStatus,
} from "@/entities/meeting";
import { useSetAttendanceStatusMutation } from "@/features/attendance-journal";

const STATUS_OPTIONS: { value: JournalStatus | ""; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "confirmed", label: "Присутствовал" },
  { value: "checked_in", label: "Отметился" },
  { value: "rejected", label: "Не присутствовал" },
  { value: "not_marked", label: "Не отметился" },
];

function actionLabel(action: string): string {
  switch (action) {
    case "meeting.attendance.confirm":
      return "подтвердил присутствие";
    case "meeting.attendance.reject":
      return "отметил отсутствие";
    case "meeting.attendance.reset":
      return "сбросил отметку";
    case "meeting.attendance.mark":
      return "изменил посещаемость";
    default:
      return action;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function PracticeJournalPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  if (!meetingId) {
    return <EmptyState icon={Lock} title="Практика не найдена" description="Проверьте ссылку или вернитесь к расписанию." />;
  }
  return <PracticeJournal meetingId={meetingId} />;
}

// Практика → текущая практика → Журнал (ТЗ «Журнал посещаемости практики» §5).
function PracticeJournal({ meetingId }: { meetingId: string }) {
  const [q, setQ] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState<JournalStatus | "">("");
  const [showLog, setShowLog] = useState(false);

  const journal = useMeetingJournalQuery(meetingId, {
    q: q || undefined,
    groupId: groupId || undefined,
    status: status || undefined,
  });
  const log = useMeetingAuditLogQuery(meetingId);
  const setStatusMutation = useSetAttendanceStatusMutation(meetingId);

  if (journal.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />;
  if (journal.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить журнал.{" "}
        <button onClick={() => journal.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const { meeting, stats, entries } = journal.data;
  const groups = meeting.groupIds.map((id, i) => ({ id, name: meeting.groupNames[i] ?? id }));

  const act = (studentId: string, next: "confirmed" | "rejected" | "not_marked") => {
    setStatusMutation.mutate(
      { studentId, status: next },
      { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось изменить отметку") },
    );
  };

  const stat = (label: string, value: number) => (
    <div key={label} className="surface-card p-3 text-center">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="space-y-5 rise-in">
      <header>
        <Link
          to={paths.curator.schedule}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Расписание
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{meeting.title}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {formatDate(meeting.date)} · {meeting.startTime}–{meeting.endTime} ·{" "}
              {meeting.teacherName ?? "без преподавателя"} · {groups.map((g) => g.name).join(", ")}
            </p>
          </div>
          {meeting.meetUrl && (
            <a
              href={meeting.meetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Video className="size-4" /> Meet
            </a>
          )}
        </div>
      </header>

      <div>
        <SectionTitle title="Статистика практики" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stat("Ожидается", stats.expected)}
          {stat("Отметились", stats.checkedIn)}
          {stat("Подтверждены", stats.confirmed)}
          {stat("Не подтвердили", stats.rejected)}
          {stat("Не отметились", stats.notMarked)}
        </div>
        <p className="mt-2 text-sm font-bold">
          Посещаемость: <span className="text-primary">{stats.attendanceRate}%</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: имя, фамилия, телефон"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        {groups.length > 1 && (
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-bold outline-none"
          >
            <option value="">Все группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as JournalStatus | "")}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-bold outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Users} title="Никого не найдено" />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.studentId} className="surface-card flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {e.lastName} {e.firstName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.groupName ?? "—"}
                  {e.phone ? ` · ${e.phone}` : ""}
                  {e.checkedInAt ? ` · отметился в ${formatTime(e.checkedInAt)}` : ""}
                </p>
              </div>
              <AttendanceStatusPill status={e.status} />
              <div className="flex shrink-0 gap-1.5">
                {e.status === "checked_in" && (
                  <>
                    <button
                      onClick={() => act(e.studentId, "confirmed")}
                      className="rounded-lg bg-success-soft px-2.5 py-1.5 text-xs font-bold text-success"
                    >
                      Подтвердить
                    </button>
                    <button
                      onClick={() => act(e.studentId, "rejected")}
                      className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive"
                    >
                      Не подтвердить
                    </button>
                  </>
                )}
                {e.status === "not_marked" && (
                  <button
                    onClick={() => act(e.studentId, "confirmed")}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-muted"
                  >
                    Подтвердить присутствие
                  </button>
                )}
                {(e.status === "confirmed" || e.status === "rejected") && (
                  <button
                    onClick={() => act(e.studentId, "not_marked")}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          {showLog ? "Скрыть историю изменений" : "Показать историю изменений"}
        </button>
        {showLog && (
          <div className="mt-2 space-y-1.5">
            {(log.data ?? []).length === 0 && <p className="text-xs text-muted-foreground">Изменений пока нет.</p>}
            {(log.data ?? []).map((l) => (
              <p key={l.id} className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{l.actorName}</span> ·{" "}
                {new Date(l.createdAt).toLocaleString("ru-RU")} — {actionLabel(l.action)}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
