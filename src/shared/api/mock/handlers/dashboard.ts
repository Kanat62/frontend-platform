import { http, HttpResponse, type HttpHandler } from "msw";
import { TODAY } from "@/shared/config";
import { daysLeft } from "@/shared/lib";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { requireCurator } from "../context";
import { attentionBuckets, effectiveAccessStatus } from "../domain";

/** `dashboard` (роль C) — BACKEND.md §12, порт CuratorDashboard из curator.index.tsx. */

export const dashboardHandlers: HttpHandler[] = [
  http.get("*/curator/dashboard", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const active = db.students.filter((s) => effectiveAccessStatus(s) === "active");
    const liveGroups = db.groups.filter((g) => g.status === "active" || g.status === "recruiting");
    const todayMeetings = db.meetings.filter((m) => m.date === TODAY && m.status === "scheduled");
    const newStudents = db.students.filter(
      (s) => daysLeft(s.startDate, TODAY) >= -3 && daysLeft(s.startDate, TODAY) <= 7,
    );
    const att = attentionBuckets(db.students, db.groups);
    const attentionCount =
      att.idleStudents.length +
      att.groupsNoTeacher.length +
      att.groupsNoLink.length +
      att.notOnboarded.length +
      att.groupsEndingSoon.length;

    // Тексты не согласуют число грамматически («3 учеников») — воспроизведено
    // как в референсе (curator.index.tsx), это не TЗ-инвариант, а её же квирк.
    const attentionRows: Dto<"CuratorDashboardDto">["attentionRows"] = (
      [
        { count: att.idleStudents.length, label: `${att.idleStudents.length} учеников не заходили 3+ дня`, to: "students" },
        { count: att.groupsNoTeacher.length, label: `${att.groupsNoTeacher.length} групп без преподавателя`, to: "groups" },
        { count: att.groupsNoLink.length, label: `${att.groupsNoLink.length} групп без ссылки на практику`, to: "groups" },
        { count: att.notOnboarded.length, label: `${att.notOnboarded.length} учеников не завершили onboarding`, to: "students" },
        { count: att.groupsEndingSoon.length, label: `${att.groupsEndingSoon.length} групп скоро заканчиваются`, to: "groups" },
      ] as const
    ).filter((r) => r.count > 0);

    const response: Dto<"CuratorDashboardDto"> = {
      curatorName: db.curator.name,
      today: TODAY,
      stats: {
        students: db.students.length,
        active: active.length,
        groups: liveGroups.length,
        teachers: db.teachers.length,
      },
      todayPracticeGroupsCount: todayMeetings.length,
      newStudentsCount: newStudents.length,
      attentionCount,
      attentionRows,
      todayMeetings: todayMeetings.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        meetUrl: m.meetUrl,
        status: m.status,
        groupName: db.groups.find((g) => g.id === m.groupId)?.name ?? null,
      })),
      idleStudents: att.idleStudents.slice(0, 6).map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        avatarTone: s.avatarTone,
        lastActivity: s.lastActivity,
      })),
    };
    return HttpResponse.json(response);
  }),
];
