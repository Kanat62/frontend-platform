import type { TestIntro } from "@/entities/lesson-test";

// Порт IntroView из english-flow/src/routes/lesson.$order_.test.tsx.
export function IntroView({
  intro,
  pending,
  onStart,
}: {
  intro: TestIntro;
  pending: boolean;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5 rise-in">
      <div className="surface-card p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Тест</p>
        <h1 className="mt-1 text-2xl font-extrabold">{intro.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Проверьте знания после урока.</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{intro.questionCount}</p>
            <p className="text-[11px] text-muted-foreground">вопросов</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{Math.round(intro.timeLimitSec / 60)} мин</p>
            <p className="text-[11px] text-muted-foreground">на тест</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{intro.passingScore}%</p>
            <p className="text-[11px] text-muted-foreground">проходной балл</p>
          </div>
        </div>

        {intro.best && (
          <p className="mt-4 text-xs text-muted-foreground">
            Последний результат: <span className="font-bold text-foreground">{intro.best.score}%</span>{" "}
            {intro.best.passed ? "· тест пройден" : "· нужно повторить"}
          </p>
        )}

        <button
          onClick={onStart}
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {intro.best ? "Пройти ещё раз" : "Начать тест"}
        </button>
      </div>
    </div>
  );
}
