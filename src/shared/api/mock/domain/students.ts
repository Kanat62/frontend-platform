import { TODAY } from "@/shared/config";
import { daysLeft } from "@/shared/lib";
import type { AccessStatus, CourseType, LanguageCode } from "@/shared/api/schema";
import type { Student } from "../seed-data/mock-data";
import { effectiveAccessStatus } from "./access";

/** Порт фильтра списка учеников из curator.students.index.tsx (store не используем — чистая функция). */
export interface StudentsQuery {
  q: string;
  language: "all" | LanguageCode;
  type: "all" | CourseType;
  status: "all" | AccessStatus;
  groupId: string; // "all" | id
  teacherId: string; // "all" | id
}

export function filterStudents(students: Student[], query: StudentsQuery): Student[] {
  const q = query.q.trim().toLowerCase();
  return students.filter((s) => {
    const st = effectiveAccessStatus(s);
    if (query.language !== "all" && s.language !== query.language) return false;
    if (query.type !== "all" && s.type !== query.type) return false;
    if (query.status !== "all" && st !== query.status) return false;
    if (query.groupId !== "all" && s.groupId !== query.groupId) return false;
    if (query.teacherId !== "all" && s.teacherId !== query.teacherId) return false;
    if (q && !`${s.firstName} ${s.lastName} ${s.login} ${s.phone}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Ученики, не заходившие 3+ дня и с активным доступом — общая логика dashboard/attention. */
export function idleActiveStudents(students: Student[], today: string = TODAY): Student[] {
  const activeStudents = students.filter((s) => effectiveAccessStatus(s, today) === "active");
  return activeStudents.filter((s) => -daysLeft(s.lastActivity, today) >= 3);
}
