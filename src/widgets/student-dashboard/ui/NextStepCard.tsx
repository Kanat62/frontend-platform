import { Link } from "react-router";
import { Clock3, PlayCircle } from "lucide-react";
import { paths } from "@/shared/config";
import { relativeDay } from "@/shared/lib";
import type { Dto } from "@/shared/api";
import type { PreviewStep } from "../model/previewStep";

// Порт NextStepCard из english-flow/src/routes/dashboard.tsx.

type NextStepView = Dto<"NextStepDto"> | PreviewStep;

const BASE =
  "relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-lift sm:p-7";
const GLOW = <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />;

export function NextStepCard({ step, dayLabel }: { step: NextStepView; dayLabel?: string }) {
  if (step.kind === "lesson") {
    return (
      <div className={BASE}>
        {GLOW}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {dayLabel ?? `Урок ${step.lesson.order}`}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.lesson.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">{step.lesson.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to={paths.student.lesson(step.lesson.order)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              <PlayCircle className="size-4" /> {dayLabel ? "Смотреть урок" : "Продолжить урок"}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75">
              <Clock3 className="size-3.5" /> Видео {step.lesson.duration}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "test") {
    return (
      <div className={BASE}>
        {GLOW}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            Урок {step.lesson.order} завершён
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">Проверь знания</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">
            {step.test.questionCount} вопросов · {step.test.minutes} минут
          </p>
          <div className="mt-5">
            <Link
              to={paths.student.lessonTest(step.lesson.order)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Пройти тест
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "practice") {
    return (
      <div className={BASE}>
        {GLOW}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {dayLabel ?? `Сегодня практика · ${step.meeting.startTime}`}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.meeting.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">
            {dayLabel ? `Google Meet · ${step.meeting.startTime}` : "Google Meet"}
          </p>
          <div className="mt-5">
            <a
              href={step.meeting.meetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Подключиться
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={BASE}>
      {GLOW}
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
          Ты всё сделал на сегодня ✓
        </p>
        <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          {step.nextMeeting ? "Ждём тебя на практике" : "Следующий урок скоро откроется"}
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-white/80">
          {step.nextMeeting
            ? `${relativeDay(step.nextMeeting.date)} · ${step.nextMeeting.startTime}`
            : "Куратор откроет новый урок после текущего этапа."}
        </p>
      </div>
    </div>
  );
}
