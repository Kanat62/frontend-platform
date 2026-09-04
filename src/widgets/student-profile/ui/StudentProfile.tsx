import { useNavigate } from "react-router";
import { CalendarDays, LogOut, Phone, Target, User2 } from "lucide-react";
import { paths } from "@/shared/config";
import { formatFull } from "@/shared/lib";
import { Avatar, SectionTitle } from "@/shared/ui";
import { useLogoutMutation } from "@/features/auth";
import { useProfileQuery } from "../api/queries";
import { AccessPill } from "./AccessPill";

// Порт ProfilePage из english-flow/src/routes/profile.tsx.
export function StudentProfile() {
  const { data: profile, isPending, isError, refetch } = useProfileQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить профиль.{" "}
        <button onClick={() => refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const rows = [
    // TODO(TЗ §15.4): «Курс: English» захардкожено в референсе (даже для RU-ученика) — воспроизведено как есть.
    { icon: User2, label: "Курс", value: "English" },
    { icon: User2, label: "Тип обучения", value: profile.type === "GROUP" ? "Групповой" : "Индивидуальный" },
    { icon: CalendarDays, label: "Начало обучения", value: formatFull(profile.startDate) },
    { icon: CalendarDays, label: "Окончание доступа", value: formatFull(profile.endDate) },
    { icon: Phone, label: "Телефон", value: profile.phone },
    { icon: User2, label: "Логин", value: profile.login },
  ];

  const practiceValue =
    profile.practiceTotal === 0 ? "—" : `${profile.practiceTotal} занятий, ${profile.practiceAttended} посещено`;

  return (
    <div className="space-y-6 rise-in">
      <div className="surface-card flex items-center gap-4 p-4">
        <Avatar name={`${profile.firstName} ${profile.lastName}`} tone={profile.avatarTone} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <User2 className="size-3.5 shrink-0" />
            {profile.type === "GROUP" ? "Групповой курс" : "Индивидуальный курс"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <AccessPill status={profile.access.status} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {profile.access.status === "active"
              ? `Осталось ${profile.access.daysLeft} дн.`
              : formatFull(profile.endDate)}
          </span>
        </div>
      </div>

      <section>
        <SectionTitle title="Цель" icon={Target} />
        <div className="surface-card p-5 text-sm">
          {/* TODO(TЗ §15.4): цель захардкожена в референсе — воспроизведено как есть. */}
          <p className="font-bold">Уверенно говорить по-английски</p>
        </div>
      </section>

      <section>
        <SectionTitle title="Обучение" />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {[
            { label: "Уроки", value: `${profile.lessonsCompleted} / ${profile.lessonsTotal}` },
            { label: "Тесты", value: `${profile.testsPassed} / ${profile.testsTotal}` },
            { label: "Практика", value: practiceValue },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Личные данные" icon={User2} />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3.5">
              <r.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{r.label}</span>
              <span className="shrink-0 text-sm font-bold">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => logout.mutate(undefined, { onSettled: () => navigate(paths.login, { replace: true }) })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
      >
        <LogOut className="size-4" /> Выйти
      </button>
    </div>
  );
}
