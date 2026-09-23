import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { ApiError } from "@/shared/lib";
import { useSessionQuery } from "@/entities/session";
import type { LanguageCode } from "@/entities/curator";
import { useStartSubstitutionMutation } from "../model/useSubstitutionMutations";

const ZONE_LABEL: Record<LanguageCode, string> = { en: "English", ru: "Русский" };
const OTHER: Record<LanguageCode, LanguageCode> = { en: "ru", ru: "en" };

/**
 * Кнопка «Начать замещение» — у обычного куратора всего 2 языковые зоны, поэтому
 * «заместить» однозначно означает вторую зону, выбор из списка не нужен (ТЗ «роли» §2).
 */
export function StartSubstitutionButton() {
  const { data: session } = useSessionQuery();
  const start = useStartSubstitutionMutation();

  const curator = session?.curator;
  if (!curator || curator.isMain || curator.substitutionZone || !curator.zone) return null;
  const otherZone = OTHER[curator.zone];

  return (
    <button
      type="button"
      onClick={() => {
        start.mutate(
          { zone: otherZone },
          {
            onSuccess: () => toast.success(`Режим замещения: ${ZONE_LABEL[otherZone]}`),
            onError: (e) => toast.error(e instanceof ApiError ? e.message : "Не удалось начать замещение"),
          },
        );
      }}
      disabled={start.isPending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
    >
      <Repeat className="size-3.5" />
      Заместить: {ZONE_LABEL[otherZone]}
    </button>
  );
}
