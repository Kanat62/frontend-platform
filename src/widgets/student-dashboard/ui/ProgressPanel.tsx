import type { ComponentType } from "react";
import { Flame, GraduationCap, Target } from "lucide-react";
import { pluralRu } from "@/shared/lib";
import type { Dto } from "@/shared/api";
import type { CefrLevel, LevelStatus } from "@/entities/program";

// Порт ProgressPanel/StatTile/LevelRoadmap из english-flow/src/routes/dashboard.tsx.

const R = 52;
const CIRC = 2 * Math.PI * R;

export function ProgressPanel({ progress }: { progress: Dto<"MeDashboardDto">["progress"] }) {
  const { level, percentInLevel, lessonsDone, lessonsTotal, streakDays, accuracyPct, daysLeftAccess, levels } =
    progress;

  return (
    <div className="surface-card overflow-hidden p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-extrabold sm:text-2xl">Уровень {level}</h3>
        <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-accent-foreground">
          {daysLeftAccess} {pluralRu(daysLeftAccess, "день", "дня", "дней")} доступа
        </span>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <div className="relative grid shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="size-36 -rotate-90 sm:size-44">
            <defs>
              <linearGradient id="progress-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--tone-1)" />
                <stop offset="100%" stopColor="var(--tone-2)" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="url(#progress-ring)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(percentInLevel / 100) * CIRC} ${CIRC}`}
              className="transition-[stroke-dasharray] duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className="text-3xl font-extrabold sm:text-4xl"
              style={{
                background: "linear-gradient(135deg, var(--tone-1), var(--tone-2))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {percentInLevel}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              путь {level}
            </span>
          </div>
        </div>

        <div className="flex w-1/2 shrink-0 flex-col gap-2">
          <StatTile
            className="ml-4"
            icon={GraduationCap}
            tone="primary"
            label="Уроков"
            value={`${lessonsDone} из ${lessonsTotal}`}
          />
          <StatTile
            icon={Flame}
            tone="warning"
            label="Streak"
            value={`${streakDays} ${pluralRu(streakDays, "день", "дня", "дней")}`}
          />
          <StatTile className="ml-4" icon={Target} tone="success" label="Точность" value={`${accuracyPct}%`} />
        </div>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <LevelRoadmap levels={levels} />
      </div>
    </div>
  );
}

const STAT_TONES = {
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
} as const;

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof STAT_TONES;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl bg-surface p-1.75 shadow-(--shadow-soft) ${className}`}>
      <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function LevelRoadmap({ levels }: { levels: LevelStatus[] }) {
  const statusOf = (l: CefrLevel) => levels.find((x) => x.level === l)?.status ?? "locked";

  return (
    <div className="flex items-start">
      {levels.map(({ level: lvl }, i) => {
        const st = statusOf(lvl);
        const label = st === "completed" ? "пройден" : st === "current" ? "сейчас" : "далее";
        const line = (active: boolean, hidden: boolean) =>
          `h-0.5 flex-1 rounded-full ${hidden ? "opacity-0" : active ? "bg-primary/40" : "bg-border"}`;
        return (
          <div key={lvl} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={line(st !== "locked", i === 0)} />
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                  st === "completed"
                    ? "bg-success-soft text-success"
                    : st === "current"
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {lvl}
              </span>
              <span
                className={line(
                  i < levels.length - 1 && statusOf(levels[i + 1]!.level) !== "locked",
                  i === levels.length - 1,
                )}
              />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                st === "current" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
