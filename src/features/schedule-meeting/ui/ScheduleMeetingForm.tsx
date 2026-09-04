import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { TODAY } from "@/shared/config";
import { Select } from "@/shared/ui";
import { useGroupsQuery } from "@/entities/group";
import { useStudentsQuery } from "@/entities/student";
import { useScheduleMeetingMutation } from "../model/useScheduleMeetingMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

/**
 * Новая практика для общего расписания — группе или индивидуальному ученику
 * (FRONTEND.md §16, шаг 6: `schedule-meeting (individual)`). Практика конкретной
 * группы со своего экрана — `ScheduleGroupMeetingForm` (без выбора группы).
 */
export function ScheduleMeetingForm() {
  const groups = useGroupsQuery("all", "all");
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
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(TODAY);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("20:00");
  const [url, setUrl] = useState("");

  const liveGroups = (groups.data?.items ?? []).filter((g) => g.status === "active" || g.status === "recruiting");
  const selectedGroup = liveGroups.find((g) => g.id === groupId);

  const submit = () => {
    if (scope === "GROUP") {
      if (!groupId) {
        toast.error("Выберите группу");
        return;
      }
      if (!url && !selectedGroup?.hasMeetUrl) {
        toast.error("Добавьте ссылку Google Meet (в группе или в форме)");
        return;
      }
      schedule.mutate(
        { scope: "GROUP", groupId, date, meetUrl: url || undefined },
        {
          onSuccess: () => {
            setUrl("");
            toast.success("Практика назначена группе");
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
          <Select
            className="lg:col-span-2"
            ariaLabel="Группа"
            value={groupId}
            onChange={setGroupId}
            placeholder="Выберите группу"
            options={liveGroups.map((g) => ({ value: g.id, label: g.name }))}
          />
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
        {scope === "INDIVIDUAL" && (
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
      </div>

      <button
        onClick={submit}
        disabled={schedule.isPending}
        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        <Plus className="size-4" /> Создать практику
      </button>
      {scope === "GROUP" && (
        <p className="text-[11px] text-muted-foreground">
          Время берётся из настроек группы — вечерний слот не зашит в код.
        </p>
      )}
    </div>
  );
}
