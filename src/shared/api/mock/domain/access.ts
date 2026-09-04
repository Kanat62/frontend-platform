import { daysLeft } from "@/shared/lib";
import type { AccessStatus } from "@/shared/api/schema";
import type { Student } from "../seed-data/mock-data";

/**
 * Порт `accessStatus` из english-flow/src/lib/store.tsx. Играет роль
 * `common/domain/access.ts` будущего бэкенда (BACKEND.md §6) — MSW считает это
 * так же, как посчитает реальный сервер; фронт эти статусы не пересчитывает.
 */
export function effectiveAccessStatus(student: Student, today?: string): AccessStatus {
  if (student.status === "disabled") return "disabled";
  return daysLeft(student.endDate, today) < 0 ? "expired" : student.status;
}
