import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { TODAY } from "@/shared/config";
import { shiftWeek, weekRangeOf } from "@/shared/lib";
import { db } from "../db";
import { badRequest, lessonsOfProduct, notFound, productById, productIdOfStudent, requireCurator } from "../context";
import type { Meeting } from "../seed-data/mock-data";
import { currentLessonOrder, groupStage, studentsInGroup, teacherOf } from "../domain";

/** `meetings` (роль C) — BACKEND.md §7.5, §12: диапазон, CRUD, посещаемость. */

function datesForRange(range: string): string[] | null {
  if (range === "today") return [TODAY];
  if (range === "week") return weekRangeOf(TODAY);
  if (range === "next-week") return weekRangeOf(shiftWeek(TODAY, 1));
  return null;
}

function meetingRoster(meeting: Meeting): Dto<"MeetingAttendeeDto">[] {
  const attended = new Set(meeting.attended ?? []);
  if (meeting.type === "GROUP") {
    if (!meeting.groupId) return [];
    return studentsInGroup(db.students, meeting.groupId).map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      avatarTone: s.avatarTone,
      present: attended.has(s.id),
    }));
  }
  const student = db.students.find((s) => s.id === meeting.studentId);
  if (!student) return [];
  return [
    {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarTone: student.avatarTone,
      present: attended.has(student.id),
    },
  ];
}

export function meetingDto(meeting: Meeting): Dto<"ScheduleMeetingDto"> {
  const group = meeting.groupId ? db.groups.find((g) => g.id === meeting.groupId) : null;
  const student = meeting.type === "INDIVIDUAL" ? db.students.find((s) => s.id === meeting.studentId) : null;
  const teacherId = group ? group.teacherId : student ? student.teacherId : null;
  const teacher = teacherOf(db.teachers, teacherId);
  return {
    id: meeting.id,
    lessonOrder: meeting.lessonOrder,
    scope: meeting.type,
    groupId: meeting.groupId,
    groupName: group?.name ?? null,
    studentId: meeting.type === "INDIVIDUAL" ? meeting.studentId : null,
    studentName: student ? `${student.firstName} ${student.lastName}` : null,
    title: meeting.title,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    meetUrl: meeting.meetUrl,
    status: meeting.status,
    teacherName: teacher?.name ?? null,
    roster: meetingRoster(meeting),
  };
}

export const meetingsHandlers: HttpHandler[] = [
  http.get("*/meetings", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const url = new URL(request.url);
    const range = url.searchParams.get("range") ?? "today";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const dates = from && to ? null : datesForRange(range);
    const items = db.meetings
      .filter((m) => (dates ? dates.includes(m.date) : from && to ? m.date >= from && m.date <= to : true))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .map(meetingDto);
    return HttpResponse.json(items);
  }),

  http.post("*/meetings", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const body = (await request.json()) as Dto<"CreateMeetingRequestDto">;

    if (body.scope === "GROUP") {
      const group = body.groupId ? db.groups.find((g) => g.id === body.groupId) : undefined;
      if (!group) return badRequest("Выберите группу");
      const meetUrl = body.meetUrl || group.meetUrl;
      if (!meetUrl) return badRequest("Добавьте ссылку Google Meet (в группе или в форме)");

      const stage = groupStage(group, lessonsOfProduct(group.courseProductId), productById(group.courseProductId)!);
      const [h, min] = group.practiceStart.split(":");
      const meeting: Meeting = {
        id: `m-${Date.now()}`,
        courseProductId: group.courseProductId,
        lessonOrder: group.currentLesson,
        studentId: "group",
        groupId: group.id,
        title: `Практика: ${stage.topic}`,
        date: body.date,
        startTime: body.startTime || group.practiceStart,
        endTime: body.endTime || group.practiceEnd || `${String((Number(h) + 1) % 24).padStart(2, "0")}:${min}`,
        meetUrl,
        type: "GROUP",
        status: "scheduled",
      };
      db.meetings.push(meeting);
      return HttpResponse.json(meetingDto(meeting), { status: 201 });
    }

    const student = body.studentId ? db.students.find((s) => s.id === body.studentId) : undefined;
    if (!student) return badRequest("Выберите ученика");
    if (!body.startTime || !body.endTime) return badRequest("Укажите время практики");
    const meetUrl = body.meetUrl;
    if (!meetUrl) return badRequest("Добавьте ссылку Google Meet");

    const productId = productIdOfStudent(student);
    const order = currentLessonOrder(student, lessonsOfProduct(productId));
    const lesson = lessonsOfProduct(productId).find((l) => l.order === order);
    const meeting: Meeting = {
      id: `m-${Date.now()}`,
      courseProductId: productId,
      lessonOrder: order,
      studentId: student.id,
      groupId: null,
      title: `Индивидуальная практика: ${lesson?.title ?? `Lesson ${order}`}`,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      meetUrl,
      type: "INDIVIDUAL",
      status: "scheduled",
    };
    db.meetings.push(meeting);
    return HttpResponse.json(meetingDto(meeting), { status: 201 });
  }),

  http.patch("*/meetings/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const meeting = db.meetings.find((m) => m.id === params.id);
    if (!meeting) return notFound("Практика не найдена");

    const body = (await request.json()) as Dto<"UpdateMeetingRequestDto">;
    if (body.status !== undefined) meeting.status = body.status;
    if (body.date !== undefined) meeting.date = body.date;
    if (body.meetUrl !== undefined) meeting.meetUrl = body.meetUrl;
    return HttpResponse.json(meetingDto(meeting));
  }),

  http.patch("*/meetings/:id/attendance", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const meeting = db.meetings.find((m) => m.id === params.id);
    if (!meeting) return notFound("Практика не найдена");

    const body = (await request.json()) as Dto<"MarkAttendanceRequestDto">;
    const attended = new Set(meeting.attended ?? []);
    if (body.present) attended.add(body.studentId);
    else attended.delete(body.studentId);
    meeting.attended = [...attended];
    return HttpResponse.json(meetingDto(meeting));
  }),
];
