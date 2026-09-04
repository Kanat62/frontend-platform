import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Presentation,
  Users,
} from "lucide-react";
import { useSessionQuery } from "@/entities/session";
import { useLogoutMutation } from "@/features/auth";
import { paths } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Avatar, Logo } from "@/shared/ui";

// Порт english-flow/src/components/CuratorShell.tsx. Гвард роли — в loader
// маршрута (app/router/guards.ts).

const nav = [
  { to: paths.curator.overview, label: "Обзор", icon: LayoutDashboard },
  { to: paths.curator.students, label: "Ученики", icon: Users },
  { to: paths.curator.groups, label: "Группы", icon: GraduationCap },
  { to: paths.curator.teachers, label: "Преподаватели", icon: Presentation },
  { to: paths.curator.schedule, label: "Расписание", icon: CalendarDays },
  { to: paths.curator.course, label: "Курсы", icon: BookOpen },
] as const;

function isActive(pathname: string, to: string) {
  return to === paths.curator.overview ? pathname === to : pathname.startsWith(to);
}

export function Component() {
  const { data: session, isError } = useSessionQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isError) navigate(paths.login, { replace: true });
  }, [isError, navigate]);

  if (!session?.curator) return <div className="min-h-screen bg-background" />;
  const curator = session.curator;

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate(paths.login, { replace: true }) });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Logo />
        <span className="mt-3 w-fit rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Кабинет куратора
        </span>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(pathname, item.to)
                  ? "bg-primary-soft text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl bg-muted/70 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={curator.name} tone="var(--tone-2)" size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{curator.name}</p>
              <p className="text-[11px] text-muted-foreground">Куратор · Преподаватель</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Выйти
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={handleLogout}
          aria-label="Выйти"
          className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 lg:pl-64 lg:pr-6 lg:pt-8 lg:pb-12">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold",
                isActive(pathname, item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  isActive(pathname, item.to) && "bg-primary-soft",
                )}
              >
                <item.icon className="size-[18px]" />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
