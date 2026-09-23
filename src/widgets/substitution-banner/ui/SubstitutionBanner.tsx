import { AlertTriangle } from "lucide-react";
import { useSessionQuery } from "@/entities/session";
import { EndSubstitutionButton } from "@/features/toggle-substitution";

const ZONE_LABEL: Record<string, string> = { en: "English", ru: "Русский" };

/** Постоянный баннер режима замещения — виден на всех страницах кабинета куратора (ТЗ «роли» §3). */
export function SubstitutionBanner() {
  const { data: session } = useSessionQuery();
  const zone = session?.curator?.substitutionZone;
  if (!zone) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-center text-xs font-bold text-warning sm:gap-3">
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className="size-3.5" />
        РЕЖИМ ЗАМЕЩЕНИЯ: {ZONE_LABEL[zone] ?? zone.toUpperCase()}
      </span>
      <EndSubstitutionButton className="rounded-lg border border-warning/40 bg-surface px-2.5 py-1 text-[11px] font-bold text-warning transition hover:opacity-80" />
    </div>
  );
}
