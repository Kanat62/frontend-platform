import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { paths } from "@/shared/config";
import { formatFull } from "@/shared/lib";
import { SectionTitle, Select } from "@/shared/ui";
import { PaymentPill, useStudentOverviewQuery, type CourseType } from "@/entities/student";
import { useGroupsQuery } from "@/entities/group";
import { useAssignStudentToGroupMutation } from "@/features/assign-student-to-group";

// Порт вкладки «Обзор» из curator.students.$id.tsx.
export function OverviewTab({ studentId, language, type }: { studentId: string; language: string; type: CourseType }) {
  const overview = useStudentOverviewQuery(studentId);
  const groups = useGroupsQuery("all", language);
  const assignGroup = useAssignStudentToGroupMutation(studentId);

  if (overview.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />;
  if (overview.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить данные.{" "}
        <button onClick={() => overview.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const o = overview.data;
  const rows: [string, string][] = [
    ["Логин", `@${o.login}`],
    ["Телефон", o.phone || "—"],
    ["Возраст", o.age ? String(o.age) : "—"],
    ["Город", o.city || "—"],
    ["Менеджер", o.managerName],
    ["Продукт", `${o.productTitle} · ${o.productPrice.toLocaleString("ru")} ${o.productCurrency}`],
    ["Начало курса", formatFull(o.startDate)],
    ["Конец курса", formatFull(o.endDate)],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <SectionTitle title="Кто и что купил" />
        <div className="surface-card divide-y divide-border overflow-hidden text-sm">
          {rows.map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-muted-foreground">{l}</span>
              <span className="text-right font-bold">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Оплата курса</span>
            <div className="flex flex-col items-end gap-1">
              <PaymentPill status={o.payment.status} />
              <span className="text-xs font-bold">
                {o.payment.paid.toLocaleString("ru")} / {o.payment.total.toLocaleString("ru")} {o.payment.currency}
                {o.payment.status !== "full" && (
                  <span className="ml-1 font-semibold text-muted-foreground">
                    (осталось {o.payment.remaining.toLocaleString("ru")})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Где учится" icon={GraduationCap} />
        <div className="surface-card space-y-3 p-4 text-sm">
          {type === "GROUP" ? (
            o.group ? (
              <Link
                to={paths.curator.group(o.group.id)}
                className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 font-bold transition hover:bg-muted"
              >
                {o.group.name}
                <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
              </Link>
            ) : (
              <p className="rounded-xl bg-warning-soft px-3 py-2.5 text-xs font-bold text-warning">Не назначен в группу</p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Индивидуальное обучение — группа не требуется.</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Преподаватель</span>
            <span className="font-bold">{o.teacherName ?? "—"}</span>
          </div>

          {type === "GROUP" && (
            <label className="block text-xs font-semibold text-muted-foreground">
              Изменить группу
              <Select
                className="mt-1"
                ariaLabel="Изменить группу"
                value={o.group?.id ?? ""}
                onChange={(v) => {
                  assignGroup.mutate(
                    { groupId: v || null },
                    {
                      onSuccess: () =>
                        toast.success(v ? "Группа изменена — расписание практики обновлено" : "Ученик снят с группы"),
                    },
                  );
                }}
                options={[
                  { value: "", label: "— без группы —" },
                  ...(groups.data?.items ?? []).map((g) => ({ value: g.id, label: g.name })),
                ]}
              />
            </label>
          )}
        </div>
      </section>
    </div>
  );
}
