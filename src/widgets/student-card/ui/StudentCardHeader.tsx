import { toast } from "sonner";
import { formatDate } from "@/shared/lib";
import { LangPill, Pill, ProgressBar, Select } from "@/shared/ui";
import { AccessPill, StudentAvatar, type AccessStatus, type StudentHeader } from "@/entities/student";
import { useUpdateStudentAccessMutation, useUpdateStudentMutation } from "@/features/edit-student-access";
import { DeleteStudentButton } from "@/features/delete-student";

// Порт шапки StudentCard из curator.students.$id.tsx.
export function StudentCardHeader({ student }: { student: StudentHeader }) {
  const updateAccess = useUpdateStudentAccessMutation(student.id);
  const updateStudent = useUpdateStudentMutation(student.id);

  return (
    <header className="surface-card p-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <StudentAvatar firstName={student.firstName} lastName={student.lastName} avatarTone={student.avatarTone} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold sm:text-2xl">
              {student.firstName} {student.lastName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <LangPill code={student.language} />
              <Pill tone={student.type === "GROUP" ? "neutral" : "primary"}>
                {student.type === "GROUP" ? "Group" : "Individual"}
              </Pill>
              <AccessPill status={student.accessStatus} />
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground sm:shrink-0">
          <p className="font-bold text-foreground">
            {student.accessStatus === "active" ? `Осталось ${student.daysLeft} дн.` : formatDate(student.endDate)}
          </p>
          <p>Последняя активность: {formatDate(student.lastActivity)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Текущий урок", v: `${student.currentLessonOrder}` },
          { l: "Прогресс", v: `${student.progressPct}%` },
          { l: "Открыто", v: `${student.openedUpTo}/${student.lessonsTotal}` },
          {
            l: "Ближайшая практика",
            v: student.nextMeeting ? `${formatDate(student.nextMeeting.date)} · ${student.nextMeeting.startTime}` : "—",
          },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-muted/70 p-3">
            <p className="text-sm font-extrabold">{x.v}</p>
            <p className="text-[11px] text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </div>

      <ProgressBar value={student.progressPct} className="mt-4" />

      <div className="mt-5 flex flex-wrap gap-2">
        <Select
          className="w-40"
          ariaLabel="Статус доступа"
          value={student.status}
          onChange={(v) => {
            updateAccess.mutate({ status: v as AccessStatus }, { onSuccess: () => toast.success("Статус обновлён") });
          }}
          options={[
            { value: "active", label: "Active" },
            { value: "expired", label: "Expired" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground">
          Доступ до
          <input
            type="date"
            defaultValue={student.endDate}
            onBlur={(e) => updateAccess.mutate({ endDate: e.target.value })}
            className="bg-transparent text-sm font-bold text-foreground outline-none"
          />
        </label>
        {!student.onboarded && (
          <button
            onClick={() => {
              updateStudent.mutate({ onboarded: true }, { onSuccess: () => toast.success("Onboarding отмечен завершённым") });
            }}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Завершить onboarding
          </button>
        )}
        <DeleteStudentButton studentId={student.id} name={`${student.firstName} ${student.lastName}`} />
      </div>
    </header>
  );
}
