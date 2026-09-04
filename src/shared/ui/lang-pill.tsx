import { Pill } from "./pill";
import type { LanguageCode } from "@/shared/api/schema";

// Порт english-flow/src/components/shared.tsx (LangPill). Живёт в shared/ui (не
// в entities/student или entities/group) — язык обучения (`en`/`ru`) не
// принадлежит одной сущности, использует его и students-table, и group-list.
export function LangPill({ code }: { code: LanguageCode }) {
  return <Pill tone={code === "en" ? "primary" : "neutral"}>{code === "en" ? "English" : "Русский"}</Pill>;
}
