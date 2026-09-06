import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { badRequest, lessonsOfProduct, notFound, productById, requireCurator } from "../context";
import {
  LANGUAGES,
  groupName,
  nextGroupCode,
  productIdFor,
  type Group,
  type Meeting,
} from "../seed-data/mock-data";
import { meetingDto } from "./meetings";
import {
  currentLessonOrder,
  effectiveAccessStatus,
  groupHealth,
  groupStage,
  groupWeekSchedule,
  idleBucketOf,
  progressOf,
  studentsInGroup,
  teacherGroupConflict,
  teacherOf,
} from "../domain";

/** `groups` + `progress` (роль C) — BACKEND.md §7.1, §12. */

function stageOf(group: Group) {
  return groupStage(group, lessonsOfProduct(group.courseProductId), productById(group.courseProductId)!);
}

function groupSummary(group: Group): Dto<"GroupSummaryDto"> {
  const stage = stageOf(group);
  const teacher = teacherOf(db.teachers, group.teacherId);
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    language: group.language,
    courseProductId: group.courseProductId,
    status: group.status,
    startDate: group.startDate,
    endDate: group.endDate,
    practiceStart: group.practiceStart,
    practiceEnd: group.practiceEnd,
    studentCount: studentsInGroup(db.students, group.id).length,
    maxStudents: group.maxStudents,
    teacherId: group.teacherId,
    teacherName: teacher?.name ?? null,
    teacherTone: teacher?.tone ?? null,
    hasMeetUrl: Boolean(group.meetUrl),
    month: stage.month,
    level: stage.level,
    lessonOrder: stage.lesson,
  };
}

export const groupsHandlers: HttpHandler[] = [
  http.get("*/groups", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "all";
    const language = url.searchParams.get("language") ?? "all";

    const items = db.groups
      .filter((g) => status === "all" || g.status === status)
      .filter((g) => language === "all" || g.language === language)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map(groupSummary);

    const response: Dto<"GroupsListDto"> = {
      items,
      byLanguage: LANGUAGES.map((l) => ({
        code: l.code,
        name: l.name,
        count: db.groups.filter((g) => g.language === l.code && g.status !== "archived").length,
      })),
    };
    return HttpResponse.json(response);
  }),

  http.post("*/groups", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const body = (await request.json()) as Dto<"CreateGroupRequestDto">;
    if (body.teacherId) {
      const conflict = teacherGroupConflict(db.groups, body.teacherId, body.practiceStart);
      if (conflict) return badRequest(`У преподавателя уже есть группа в ${body.practiceStart}: ${conflict.name}`);
    }

    const start = new Date(body.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + body.durationMonths);
    const code = nextGroupCode(db.groups, body.language);

    const group: Group = {
      id: `g-${Date.now()}`,
      code,
      name: groupName(code, body.language, body.startDate, body.practiceStart),
      language: body.language,
      durationMonths: body.durationMonths,
      courseProductId: productIdFor(body.language, "GROUP", body.durationMonths),
      startDate: body.startDate,
      endDate: end.toISOString().slice(0, 10),
      practiceStart: body.practiceStart,
      practiceEnd: body.practiceEnd,
      teacherId: body.teacherId,
      maxStudents: body.maxStudents || 50,
      status: "recruiting",
      currentLesson: 1,
      meetUrl: "",
    };
    db.groups.push(group);
    return HttpResponse.json(groupSummary(group), { status: 201 });
  }),

  http.get("*/groups/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const stage = stageOf(group);
    const health = groupHealth(db.students, group.id);
    const roster = studentsInGroup(db.students, group.id);
    const lessons = lessonsOfProduct(group.courseProductId);
    const recentMeetings = db.meetings
      .filter((m) => m.groupId === group.id)
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
      .slice(0, 5);

    const response: Dto<"GroupDetailDto"> = {
      ...groupSummary(group),
      topic: stage.topic,
      currentLesson: group.currentLesson,
      meetUrl: group.meetUrl,
      health,
      weekSchedule: groupWeekSchedule(group),
      recentMeetings: recentMeetings.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        meetUrl: m.meetUrl,
        status: m.status,
      })),
      roster: roster.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        avatarTone: s.avatarTone,
        currentLessonOrder: currentLessonOrder(s, lessons),
        progressPct: progressOf(s, lessons),
        lastActivity: s.lastActivity,
        accessStatus: effectiveAccessStatus(s),
        idleBucket: idleBucketOf(s),
      })),
    };
    return HttpResponse.json(response);
  }),

  http.patch("*/groups/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const body = (await request.json()) as Dto<"UpdateGroupRequestDto">;
    if (body.status !== undefined) group.status = body.status;
    if (body.meetUrl !== undefined) group.meetUrl = body.meetUrl;
    if (body.maxStudents !== undefined) group.maxStudents = body.maxStudents;
    return HttpResponse.json(groupSummary(group));
  }),

  http.patch("*/groups/:id/teacher", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const body = (await request.json()) as Dto<"AssignTeacherRequestDto">;
    if (body.teacherId) {
      const conflict = teacherGroupConflict(db.groups, body.teacherId, group.practiceStart, group.id);
      if (conflict) return badRequest(`Нельзя назначить: в ${group.practiceStart} у преподавателя уже «${conflict.name}»`);
    }
    group.teacherId = body.teacherId;
    for (const student of db.students) {
      if (student.groupId === group.id) student.teacherId = body.teacherId;
    }
    return HttpResponse.json(groupSummary(group));
  }),

  // `progress` module (BACKEND.md §7.1) — «одна транзакция» на реальном бэкенде;
  // здесь — синхронная мутация `db` внутри одного обработчика запроса (тот же эффект).
  http.post("*/groups/:id/publish-lesson", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const lessons = lessonsOfProduct(group.courseProductId);
    const body = (await request.json()) as Dto<"OpenCloseLessonRequestDto">;
    if (body.order < 1 || body.order > lessons.length) return badRequest("Некорректный номер урока");

    group.currentLesson = Math.max(group.currentLesson, body.order);
    for (const student of db.students) {
      if (student.groupId === group.id && effectiveAccessStatus(student) === "active" && student.openedUpTo < body.order) {
        student.openedUpTo = body.order;
      }
    }
    return HttpResponse.json(groupSummary(group));
  }),

  http.post("*/groups/:id/unpublish-lesson", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const body = (await request.json()) as Dto<"OpenCloseLessonRequestDto">;
    group.currentLesson = Math.max(0, Math.min(group.currentLesson, body.order - 1));
    for (const student of db.students) {
      if (student.groupId === group.id && student.openedUpTo >= body.order) {
        student.openedUpTo = body.order - 1;
      }
    }
    return HttpResponse.json(groupSummary(group));
  }),

  http.post("*/groups/:id/meetings", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const group = db.groups.find((g) => g.id === params.id);
    if (!group) return notFound("Группа не найдена");

    const body = (await request.json()) as Dto<"ScheduleGroupMeetingRequestDto">;
    const meetUrl = body.meetUrl || group.meetUrl;
    if (!meetUrl) return badRequest("Добавьте ссылку Google Meet (в группе или в форме)");

    const stage = stageOf(group);
    const [h, min] = group.practiceStart.split(":");
    const meeting: Meeting = {
      id: `m-${Date.now()}`,
      courseProductId: group.courseProductId,
      lessonOrder: group.currentLesson,
      studentId: "group",
      groupId: group.id,
      title: `Практика: ${stage.topic}`,
      date: body.date,
      startTime: group.practiceStart,
      endTime: group.practiceEnd || `${String((Number(h) + 1) % 24).padStart(2, "0")}:${min}`,
      meetUrl,
      type: "GROUP",
      status: "scheduled",
    };
    db.meetings.push(meeting);
    return HttpResponse.json(meetingDto(meeting), { status: 201 });
  }),
];
