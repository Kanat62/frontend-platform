import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { BookOpen, CalendarClock, Home, LogOut, User } from "lucide-react";
import { useSessionQuery } from "@/entities/session";
import { useLogoutMutation } from "@/features/auth";
import { paths } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Avatar, Balance, Logo } from "@/shared/ui";

// Порт english-flow/src/components/StudentShell.tsx. Гвард роли уже отработал в
// loader маршрута (app/router/guards.ts) — здесь только рендер шелла + защитный
// редирект, если сессия «умерла» пока пользователь сидит на странице (FRONTEND.md §9).

const nav = [
  { to: paths.student.dashboard, label: "Главная", icon: Home },
  { to: paths.student.learn, label: "Курс", icon: BookOpen },
  { to: paths.student.schedule, label: "Расписание", icon: CalendarClock },
  { to: paths.student.profile, label: "Профиль", icon: User },
] as const;

function isActive(pathname: string, to: string) {
  return to === paths.student.dashboard ? pathname === to : pathname.startsWith(to);
}

export function Component() {
  const { data: session, isError } = useSessionQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isError) navigate(paths.login, { replace: true });
  }, [isError, navigate]);

  if (!session?.student) return <div className="min-h-screen bg-background" />;
  const student = session.student;
  const fullName = `${student.firstName} ${student.lastName}`;

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate(paths.login, { replace: true }) });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-muted/70 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={fullName} tone={student.avatarTone} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{student.firstName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {student.type === "GROUP" ? "Группа" : "Индивидуально"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Выйти
          </button>
        </div>
      </aside>

      {/* Mobile header — shown on every page, not fixed/sticky */}
      <header className="flex items-center justify-between border-b border-border bg-surface/85 px-4 py-3 lg:hidden">
        <Logo />
        <div className="flex items-center gap-2.5">
          <Balance amount={0} />
          <Avatar name={fullName} tone={student.avatarTone} size="sm" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 lg:pl-64 lg:pr-6 lg:pt-8 lg:pb-12">
        <div className="lg:max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <item.icon className="size-6" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
