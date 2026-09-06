import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { TODAY } from "@/shared/config";
import { db } from "../db";
import { lessonsOfProduct, notFound, productById, requireCurator } from "../context";
import type { Teacher } from "../seed-data/mock-data";
import { groupStage, studentsInGroup } from "../domain";

/** `teachers` (роль C) — BACKEND.md §12: список + сводка + карточка. */

function teacherGroups(teacher: Teacher) {
  return db.groups.filter((g) => g.teacherId === teacher.id && g.status !== "archived");
}

function teacherIndividuals(teacher: Teacher) {
  return db.students.filter((s) => s.type === "INDIVIDUAL" && s.teacherId === teacher.id);
}

function practicesTodayFor(groups: { id: string }[]) {
  return db.meetings.filter(
    (m) => m.date === TODAY && m.status === "scheduled" && groups.some((g) => g.id === m.groupId),
  ).length;
}

function nextPracticeDateFor(groups: { id: string }[]): string | null {
  const upcoming = db.meetings
    .filter((m) => m.status === "scheduled" && m.date >= TODAY && groups.some((g) => g.id === m.groupId))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  return upcoming?.date ?? null;
}

function teacherListItem(teacher: Teacher): Dto<"TeacherListItemDto"> {
  const groups = teacherGroups(teacher);
  const groupStudents = groups.reduce((sum, g) => sum + studentsInGroup(db.students, g.id).length, 0);
  const individuals = teacherIndividuals(teacher);
  return {
    id: teacher.id,
    name: teacher.name,
    languages: teacher.languages,
    status: teacher.status,
    phone: teacher.phone,
    tone: teacher.tone,
    groupsCount: groups.length,
    studentsCount: groupStudents + individuals.length,
    nextPracticeDate: nextPracticeDateFor(groups),
  };
}

export const teachersHandlers: HttpHandler[] = [
  http.get("*/teachers", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const items = db.teachers.map(teacherListItem);
    const response: Dto<"TeachersListDto"> = {
      items,
      summary: {
        active: db.teachers.filter((t) => t.status === "active").length,
        absent: db.teachers.filter((t) => t.status === "absent").length,
        replacement: db.teachers.filter((t) => t.status === "replacement").length,
        practicesToday: db.meetings.filter((m) => m.date === TODAY && m.status === "scheduled").length,
      },
    };
    return HttpResponse.json(response);
  }),

  http.post("*/teachers", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const body = (await request.json()) as Dto<"CreateTeacherRequestDto">;
    const tones = ["var(--tone-1)", "var(--tone-2)", "var(--tone-3)", "var(--tone-4)", "var(--tone-5)"];
    const teacher: Teacher = {
      id: `t-${Date.now()}`,
      name: body.name.trim(),
      phone: body.phone,
      languages: body.languages.length > 0 ? body.languages : ["en"],
      status: "active",
      tone: tones[db.teachers.length % tones.length]!,
    };
    db.teachers.push(teacher);
    return HttpResponse.json(teacherListItem(teacher), { status: 201 });
  }),

  http.get("*/teachers/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const teacher = db.teachers.find((t) => t.id === params.id);
    if (!teacher) return notFound("Преподаватель не найден");

    const groups = teacherGroups(teacher);
    const groupStudents = groups.reduce((sum, g) => sum + studentsInGroup(db.students, g.id).length, 0);
    const individuals = teacherIndividuals(teacher);

    const response: Dto<"TeacherDetailDto"> = {
      id: teacher.id,
      name: teacher.name,
      languages: teacher.languages,
      status: teacher.status,
      phone: teacher.phone,
      tone: teacher.tone,
      stats: {
        groupsCount: groups.length,
        groupStudents,
        individualsCount: individuals.length,
        practicesToday: practicesTodayFor(groups),
      },
      groups: groups.map((g) => {
        const stage = groupStage(g, lessonsOfProduct(g.courseProductId), productById(g.courseProductId)!);
        return {
          id: g.id,
          name: g.name,
          language: g.language,
          status: g.status,
          practiceStart: g.practiceStart,
          practiceEnd: g.practiceEnd,
          studentCount: studentsInGroup(db.students, g.id).length,
          maxStudents: g.maxStudents,
          month: stage.month,
          level: stage.level,
        };
      }),
      individuals: individuals.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        avatarTone: s.avatarTone,
        language: s.language,
      })),
    };
    return HttpResponse.json(response);
  }),

  http.patch("*/teachers/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const teacher = db.teachers.find((t) => t.id === params.id);
    if (!teacher) return notFound("Преподаватель не найден");

    const body = (await request.json()) as Dto<"UpdateTeacherRequestDto">;
    if (body.status) teacher.status = body.status;
    return HttpResponse.json(teacherListItem(teacher));
  }),
];
