import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { EmptyState } from "@/shared/ui";
import { useTestIntroQuery } from "@/entities/lesson-test";
import { useAttemptQuery } from "@/entities/test-attempt";
import { useSaveAnswerMutation, useStartAttemptMutation, useSubmitAttemptMutation } from "@/features/take-test";
import { IntroView } from "./IntroView";
import { TakingView } from "./TakingView";
import { ResultView } from "./ResultView";

// Порт TestPage из english-flow/src/routes/lesson.$order_.test.tsx.
export function TestRunner({ order }: { order: number }) {
  const intro = useTestIntroQuery(order);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const attemptQuery = useAttemptQuery(attemptId);
  const start = useStartAttemptMutation(order);
  const saveAnswer = useSaveAnswerMutation(attemptId ?? "");
  const submit = useSubmitAttemptMutation(attemptId ?? "");
  const [remaining, setRemaining] = useState(0);
  const autoSubmittedRef = useRef(false);
  // Подхватываем активную попытку из интро только один раз на урок (при заходе/смене
  // урока) — не на каждый рефетч интро, иначе submit (который инвалидирует весь `me`,
  // т.к. результат виден и в курсе/дашборде) откатывал бы уже отправленную попытку
  // обратно на IntroView, потеряв локальный `attemptId`.
  const hydratedOrderRef = useRef<number | null>(null);

  useEffect(() => {
    if (!intro.data || hydratedOrderRef.current === order) return;
    hydratedOrderRef.current = order;
    setAttemptId(intro.data.activeAttemptId ?? null);
    autoSubmittedRef.current = false;
  }, [order, intro.data]);

  const attempt = attemptQuery.data;
  const expiresAt = attempt && attempt.status === "in_progress" ? attempt.expiresAt : null;

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        submit.mutate(undefined, {
          onSuccess: () => toast.info("Время закончилось — тест отправлен автоматически"),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  if (intro.isPending) {
    return (
      <div className="space-y-5">
        <BackLink order={order} />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }

  if (intro.isError) {
    if (intro.error instanceof ApiError && intro.error.status === 404) {
      return (
        <div className="space-y-5">
          <BackLink order={order} />
          <EmptyState icon={Lock} title="Тест не найден" description="Проверьте ссылку или вернитесь к уроку." />
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <BackLink order={order} />
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить тест.{" "}
          <button onClick={() => intro.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (intro.data.availability === "locked") {
    return (
      <div className="space-y-5">
        <BackLink order={order} />
        <EmptyState
          icon={Lock}
          title="Тест пока недоступен"
          description={
            intro.data.lockedReason === "lesson_not_completed"
              ? "Досмотрите видеоурок, чтобы открыть тест."
              : "Тест ещё не опубликован куратором."
          }
        />
      </div>
    );
  }

  if (intro.data.questionCount === 0) {
    return (
      <div className="space-y-5">
        <BackLink order={order} />
        <EmptyState icon={AlertTriangle} title="Тест ещё готовится" description="Куратор пока не добавил вопросы." />
      </div>
    );
  }

  // Есть activeAttemptId из интро, но сама попытка ещё грузится — не мигаем IntroView.
  if (attemptId !== null && attemptQuery.isPending) {
    return (
      <div className="space-y-5">
        <BackLink order={order} />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rise-in">
      <BackLink order={order} />

      {attempt && attempt.status === "submitted" ? (
        <ResultView attempt={attempt} />
      ) : attempt && attempt.status === "in_progress" ? (
        <TakingView
          attempt={attempt}
          remaining={remaining}
          submitting={submit.isPending}
          onAnswer={(questionId, optionIds) => saveAnswer.mutate({ questionId, optionIds })}
          onSubmit={() => submit.mutate(undefined)}
        />
      ) : (
        <IntroView
          intro={intro.data}
          pending={start.isPending}
          onStart={() => start.mutate(undefined, { onSuccess: (a) => setAttemptId(a.id) })}
        />
      )}
    </div>
  );
}

function BackLink({ order }: { order: number }) {
  return (
    <Link
      to={paths.student.lesson(order)}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Вернуться к уроку
    </Link>
  );
}
