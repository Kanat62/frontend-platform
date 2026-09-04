import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { formatFull } from "@/shared/lib";
import { Pill, SectionTitle } from "@/shared/ui";
import { useStudentOverviewQuery, type LanguageCode } from "@/entities/student";
import { useUpdateStudentMutation } from "@/features/edit-student-access";

const LANGUAGE_NAME_RU: Record<LanguageCode, string> = { en: "Английский язык", ru: "Русский язык" };

// Порт вкладки «Оплата» из curator.students.$id.tsx.
export function PaymentTab({ studentId, language }: { studentId: string; language: LanguageCode }) {
  const overview = useStudentOverviewQuery(studentId);
  const update = useUpdateStudentMutation(studentId);

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

  const pay = overview.data.payment;

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <SectionTitle title="Платёжная информация" icon={CalendarClock} />
        <p className="mb-3 text-xs text-muted-foreground">Платформа не принимает оплату — данные передаёт отдел продаж.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Стоимость", v: pay.total.toLocaleString("ru") },
            { l: "Оплачено", v: pay.paid.toLocaleString("ru") },
            { l: "Осталось", v: pay.remaining.toLocaleString("ru") },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3 text-center">
              <p className="text-base font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Дата покупки</span>
          <span className="font-bold">{formatFull(pay.purchaseDate)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Статус оплаты</span>
          <Pill tone={pay.status === "full" ? "success" : pay.status === "partial" ? "warning" : "danger"}>
            {pay.status === "full" ? "Оплачено полностью" : pay.status === "partial" ? "Первоначальный платёж" : "Не оплачено"}
          </Pill>
        </div>
      </div>
      <div className="surface-card space-y-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Обновить платёж</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Общая сумма
            <input
              type="number"
              defaultValue={pay.total}
              onBlur={(e) => {
                const total = Number(e.target.value) || pay.total;
                update.mutate({ payment: { total, paid: pay.paid } }, { onSuccess: () => toast.success("Оплата обновлена") });
              }}
              className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Оплачено
            <input
              type="number"
              defaultValue={pay.paid}
              onBlur={(e) => {
                const paid = Number(e.target.value) || 0;
                update.mutate({ payment: { total: pay.total, paid } }, { onSuccess: () => toast.success("Оплата обновлена") });
              }}
              className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Доступ выдаётся независимо от полноты оплаты — бизнес утверждает правило отдельно. Продукт: {LANGUAGE_NAME_RU[language]}.
        </p>
      </div>
    </div>
  );
}
