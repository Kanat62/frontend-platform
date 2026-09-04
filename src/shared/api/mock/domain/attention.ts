import { TODAY } from "@/shared/config";
import { daysLeft } from "@/shared/lib";
import type { Group, Student } from "../seed-data/mock-data";
import { effectiveAccessStatus } from "./access";
import { idleActiveStudents } from "./students";

/** Порт `attentionBuckets` из store.tsx — куратор-дашборд и раздел «Требует внимания». */
export interface AttentionBuckets {
  idleStudents: Student[];
  groupsNoTeacher: Group[];
  groupsNoLink: Group[];
  notOnboarded: Student[];
  groupsEndingSoon: Group[];
}

export function attentionBuckets(students: Student[], groups: Group[], today: string = TODAY): AttentionBuckets {
  const activeStudents = students.filter((s) => effectiveAccessStatus(s, today) === "active");
  return {
    idleStudents: idleActiveStudents(students, today),
    groupsNoTeacher: groups.filter((g) => !g.teacherId && (g.status === "active" || g.status === "recruiting")),
    groupsNoLink: groups.filter((g) => !g.meetUrl && (g.status === "active" || g.status === "recruiting")),
    notOnboarded: activeStudents.filter((s) => !s.onboarded),
    groupsEndingSoon: groups.filter(
      (g) => g.status === "active" && daysLeft(g.endDate, today) <= 21 && daysLeft(g.endDate, today) >= 0,
    ),
  };
}
