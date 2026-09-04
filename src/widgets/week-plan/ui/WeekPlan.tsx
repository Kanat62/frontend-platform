import { useScheduleQuery } from "../api/queries";
import { DayRow } from "./DayRow";

// Порт SchedulePage из english-flow/src/routes/practice.tsx.
export function WeekPlan() {
  const { data: days, isPending, isError, refetch } = useScheduleQuery();

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить расписание.{" "}
        <button onClick={() => refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rise-in">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
        <p className="text-sm text-muted-foreground">План на неделю.</p>
      </header>

      <div>
        {days.map((day, i) => (
          <DayRow key={day.date} day={day} first={i === 0} last={i === days.length - 1} />
        ))}
      </div>
    </div>
  );
}
