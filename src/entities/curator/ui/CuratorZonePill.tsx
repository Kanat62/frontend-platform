import { Pill } from "@/shared/ui";
import type { LanguageCode } from "../model/types";

const ZONE_LABEL: Record<LanguageCode, string> = { en: "English", ru: "Русский" };

/** Зона куратора — `null` только у главного (видит всё). */
export function CuratorZonePill({ zone }: { zone: LanguageCode | null }) {
  if (!zone) return <Pill tone="primary">Все зоны</Pill>;
  return <Pill tone="neutral">{ZONE_LABEL[zone]}</Pill>;
}
