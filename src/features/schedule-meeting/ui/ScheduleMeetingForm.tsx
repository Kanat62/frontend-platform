import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError, todayISO } from "@/shared/lib";
import { Select } from "@/shared/ui";
import { useGroupsQuery } from "@/entities/group";
import { useStudentsQuery } from "@/entities/student";
import { useTeacherOptionsQuery } from "@/entities/teacher";
import { useScheduleMeetingMutation } from "../model/useScheduleMeetingMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

/**
 * Новая практика для общего расписания — одной/нескольким группам (один
 * Google Meet на несколько групп, ТЗ «Журнал посещаемости практики» §2) или
 * индивидуальному ученику (FRONTEND.md §16, шаг 6). Практика конкретной
 * группы со своего экрана — `ScheduleGroupMeetingForm` (без выбора группы).
 */
export function ScheduleMeetingForm() {
  const groups = useGroupsQuery("all", "all");
  const teachers = useTeacherOptionsQuery();
  const individuals = useStudentsQuery({
    q: "",
    language: "all",
    type: "INDIVIDUAL",
    status: "active",
    groupId: "all",
    teacherId: "all",
    page: 1,
  });
  const schedule = useScheduleMeetingMutation();

  const [scope, setScope] = useState<"GROUP" | "INDIVIDUAL">("GROUP");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(todayISO);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("20:00");
  const [url, setUrl] = useState("");

  const liveGroups = (groups.data?.items ?? []).filter((g) => g.status === "active" || g.status === "recruiting");
  const selectedGroups = liveGroups.filter((g) => groupIds.includes(g.id));
  const isMulti = groupIds.length > 1;

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      const language = liveGroups.find((g) => g.id === id)?.language;
      // Группы одной практики — только одного языка (ТЗ §2): смена языка сбрасывает выбор.
      const sameLanguage = prev.every((pid) => liveGroups.find((g) => g.id === pid)?.language === language);
      return sameLanguage ? [...prev, id] : [id];
    });
  };

  const submit = () => {
    if (scope === "GROUP") {
      if (groupIds.length === 0) {
        toast.error("Выберите хотя бы одну группу");
        return;
      }
      if (isMulti && (!start || !end)) {
        toast.error("Для практики на несколько групп укажите время явно");
        return;
      }
      if (!url && !(groupIds.length === 1 && selectedGroups[0]?.hasMeetUrl)) {
        toast.error("Добавьте ссылку Google Meet (в группе или в форме)");
        return;
      }
      schedule.mutate(
        {
          scope: "GROUP",
          groupIds,
          ...(teacherId ? { teacherId } : {}),
          date,
          ...(isMulti ? { startTime: start, endTime: end } : {}),
          meetUrl: url || undefined,
        },
        {
          onSuccess: () => {
            setUrl("");
            toast.success(groupIds.length > 1 ? "Практика назначена группам" : "Практика назначена группе");
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось назначить практику"),
        },
      );
      return;
    }

    if (!studentId) {
      toast.error("Выберите ученика");
      return;
    }
    if (!url) {
      toast.error("Добавьте ссылку Google Meet");
      return;
    }
    schedule.mutate(
      { scope: "INDIVIDUAL", studentId, date, startTime: start, endTime: end, meetUrl: url },
      {
        onSuccess: () => {
          setUrl("");
          toast.success("Индивидуальная практика назначена");
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось назначить практику"),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["GROUP", "INDIVIDUAL"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
              scope === s ? "border-primary bg-primary-soft" : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {s === "GROUP" ? "Группе" : "Индивидуальному ученику"}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {scope === "GROUP" ? (
          <div className="rounded-xl border border-input bg-surface p-2.5 lg:col-span-2">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Группы — можно несколько, если это один Google Meet
            </p>
            <div className="flex flex-wrap gap-1.5">
              {liveGroups.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                    groupIds.includes(g.id)
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Select
            className="lg:col-span-2"
            ariaLabel="Ученик"
            value={studentId}
            onChange={setStudentId}
            placeholder="Выберите ученика"
            options={(individuals.data?.items ?? []).map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName}`,
            }))}
          />
        )}
        <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        {(scope === "INDIVIDUAL" || isMulti) && (
          <div className="flex gap-2">
            <input type="time" className={field} value={start} onChange={(e) => setStart(e.target.value)} />
            <input type="time" className={field} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        )}
        <input
          className={field}
          placeholder={scope === "GROUP" ? "Google Meet URL (или ссылка группы)" : "Google Meet URL"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {scope === "GROUP" && (
          <Select
            ariaLabel="Преподаватель"
            value={teacherId}
            onChange={setTeacherId}
            placeholder="Преподаватель (по умолчанию — из группы)"
            options={(teachers.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
        )}
      </div>

      <button
        onClick={submit}
        disabled={schedule.isPending}
        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        <Plus className="size-4" /> Создать практику
      </button>
      {scope === "GROUP" && !isMulti && (
        <p className="text-[11px] text-muted-foreground">
          Время берётся из настроек группы — вечерний слот не зашит в код.
        </p>
      )}
    </div>
  );
}
