import { PlayCircle } from "lucide-react";
import { Logo } from "@/shared/ui";
import { LoginForm } from "@/features/auth";

// Порт english-flow/src/routes/index.tsx (LoginPage). JSX/Tailwind — 1:1 с
// референсом; форма и вход по ролям — features/auth (FRONTEND.md §16, шаг 2).
export function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden gradient-hero p-12 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="size-9 shrink-0 object-contain"
          />
          <div className="-ml-1 leading-none">
            <div className="text-[16px] font-extrabold tracking-tight">Sozmor</div>
            <div className="mt-1 text-[10px] font-bold tracking-wide text-white/70">Academy</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05]">
            Твой английский.
            <br />
            <span className="text-white/70">Один экран.</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Теория, видео, практика в Google Meet и прогресс — без Telegram, таблиц и вопросов
            «какой у меня сегодня урок».
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Текущий урок открывает куратор",
              "Практика и ссылка Meet всегда под рукой",
              "Прогресс по 54 урокам курса",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <PlayCircle className="size-4 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          Group · 6 месяцев · 15 000 сом &nbsp;•&nbsp; Individual · 1 месяц · 20 000 сом
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm rise-in">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-8 text-2xl font-extrabold lg:mt-0">Вход в платформу</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Логин и пароль выдаёт куратор после оплаты.
          </p>

          <LoginForm />
        </div>
      </section>
    </div>
  );
}
