import { http, HttpResponse, type HttpHandler } from "msw";
import { TODAY } from "@/shared/config";
import { daysLeft, weekRangeOf } from "@/shared/lib";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { currentStudent, notFound, unauthorized } from "../context";
import { courseProduct, COURSE_STAGES, type Lesson, type Meeting, type Student } from "../seed-data/mock-data";
import {
  activityDatesFor,
  bestAttempt,
  courseLevels,
  currentLessonOrder,
  effectiveAccessStatus,
  lessonState,
  levelStatus,
  meetingsFor,
  nextStepFor,
  stageStatus,
  streakDays,
  testAvailability,
  testForLesson,
  testsStats,
  practiceStats,
  watchedPctOf,
  weekAgenda,
  weekPlan,
} from "../domain";

/**
 * `/me/*` — BACKEND.md §12 (роль student, `studentId` только из токена — нет
 * IDOR, TЗ §3.3). Вычисляемые поля (`accessStatus`, `lessonState`, `progress`,
 * `nextStep`, `testAvailability`, уровни/месяцы) считает MSW — так же, как
 * посчитает реальный бэкенд; фронт их не пересчитывает (FRONTEND.md §7).
 */

function lessonSummary(lesson: Lesson): Dto<"LessonSummaryDto"> {
  return {
    order: lesson.order,
    title: lesson.title,
    description: lesson.description,
    duration: lesson.duration,
  };
}

function meetingSummary(meeting: Meeting): Dto<"MeetingSummaryDto"> {
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    meetUrl: meeting.meetUrl,
    status: meeting.status,
    type: meeting.type,
    lessonOrder: meeting.lessonOrder,
  };
}

/** Встроенный в урок статус теста — TestRow в course-lesson-list и TestCard в lesson-viewer. */
function lessonTestSummary(student: Student, order: number): Dto<"LessonTestSummaryDto"> | undefined {
  const test = testForLesson(db.tests, order);
  if (!test) return undefined;
  const availability = testAvailability(student, test, db.attempts);
  const best = bestAttempt(db.attempts, student.id, test.id);
  return {
    title: test.title,
    questionCount: test.questions.length,
    minutes: Math.round(test.timeLimitSec / 60),
    availability,
    ...(best?.score !== undefined && best.score !== null ? { bestScore: best.score } : {}),
  };
}

export const meHandlers: HttpHandler[] = [
  http.get("*/me/dashboard", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const meetings = meetingsFor(db.meetings, student);
    const week = weekRangeOf(TODAY);
    const agenda = weekAgenda(student, db.lessons, db.tests, db.attempts, meetings, week);
    const step = nextStepFor(student, db.lessons, db.tests, db.attempts, meetings);
    const currentOrder = currentLessonOrder(student);
    const currentLesson = db.lessons.find((l) => l.order === currentOrder) ?? null;

    const levels = courseLevels();
    const statusOf = (l: (typeof levels)[number]) => levelStatus(student, db.lessons, l);
    const currentLevel =
      levels.find((l) => statusOf(l) === "current") ??
      [...levels].reverse().find((l) => statusOf(l) === "completed") ??
      levels[0]!;
    const levelBlocks = COURSE_STAGES.filter((s) => s.level === currentLevel).map((s) => s.block);
    const levelLessons = db.lessons.filter((l) => levelBlocks.includes(l.block));
    const levelDone = levelLessons.filter((l) => student.completed.includes(l.order)).length;
    const percentInLevel = levelLessons.length ? Math.round((levelDone / levelLessons.length) * 100) : 0;
    const streak = streakDays(activityDatesFor(student, db.attempts, meetings));

    let nextStep: Dto<"NextStepDto">;
    if (step.kind === "lesson") {
      nextStep = { kind: "lesson", lesson: lessonSummary(step.lesson) };
    } else if (step.kind === "test") {
      nextStep = {
        kind: "test",
        lesson: lessonSummary(step.lesson),
        test: {
          questionCount: step.test.questions.length,
          minutes: Math.round(step.test.timeLimitSec / 60),
        },
      };
    } else if (step.kind === "practice") {
      nextStep = { kind: "practice", meeting: meetingSummary(step.meeting) };
    } else {
      nextStep = {
        kind: "done",
        ...(step.nextMeeting ? { nextMeeting: meetingSummary(step.nextMeeting) } : {}),
      };
    }

    const response: Dto<"MeDashboardDto"> = {
      firstName: student.firstName,
      courseType: student.type,
      learningLanguage: student.language,
      access: { status: effectiveAccessStatus(student), daysLeft: daysLeft(student.endDate) },
      week: agenda.map((d) => ({ date: d.date, items: d.items })),
      currentLesson: currentLesson ? lessonSummary(currentLesson) : null,
      nextStep,
      meetings: meetings.map(meetingSummary),
      progress: {
        level: currentLevel,
        percentInLevel,
        lessonsDone: student.completed.length,
        lessonsTotal: db.lessons.length,
        streakDays: streak,
        // TODO(TЗ §15.4): «Точность 87%» захардкожена в референсе (ProgressPanel) — воспроизведено как есть.
        accuracyPct: 87,
        // TODO(TЗ §15.4): «180 дней доступа» захардкожено в референсе (`left = 180`).
        daysLeftAccess: 180,
        levels: levels.map((level) => ({ level, status: statusOf(level) })),
      },
    };
    return HttpResponse.json(response);
  }),

  http.get("*/me/course", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const product = courseProduct(student.language, student.type);
    const response: Dto<"MeCourseDto"> = {
      language: student.language,
      productTitle: product.title,
      completed: student.completed.length,
      total: db.lessons.length,
      currentLessonOrder: currentLessonOrder(student),
      blocks: COURSE_STAGES.map((stage) => ({
        block: stage.block,
        level: stage.level,
        month: stage.month,
        title: stage.title,
        status: stageStatus(student, db.lessons, stage),
      })),
    };
    return HttpResponse.json(response);
  }),

  http.get("*/me/lessons", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const response: Dto<"LessonListItemDto">[] = db.lessons.map((lesson) => {
      const test = lessonTestSummary(student, lesson.order);
      return {
        ...lessonSummary(lesson),
        block: lesson.block,
        state: lessonState(student, lesson.order),
        ...(test ? { test } : {}),
      };
    });
    return HttpResponse.json(response);
  }),

  http.get("*/me/lessons/:order", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const order = Number(params.order);
    const lesson = db.lessons.find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");

    const state = lessonState(student, order);
    const prevLesson = db.lessons.find((l) => l.order === order - 1);
    const nextLesson = db.lessons.find((l) => l.order === order + 1);
    const nextLocked = nextLesson ? nextLesson.order > student.openedUpTo : true;
    const test = lessonTestSummary(student, order);

    const response: Dto<"LessonDetailDto"> = {
      ...lessonSummary(lesson),
      block: lesson.block,
      state,
      // Урок «закрыт» — видео не отдаём (то, что гейтит доступ, фронт не пересчитывает).
      videoUrl: state === "locked" ? "" : lesson.videoUrl,
      watchedPct: watchedPctOf(student, order),
      ...(prevLesson ? { prev: { order: prevLesson.order, title: prevLesson.title } } : {}),
      ...(nextLesson ? { next: { order: nextLesson.order, title: nextLesson.title } } : {}),
      nextLocked,
      ...(test ? { test } : {}),
    };
    return HttpResponse.json(response);
  }),

  http.get("*/me/schedule", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const meetings = meetingsFor(db.meetings, student);
    const week = weekRangeOf(TODAY);
    const days = weekPlan(student, db.lessons, db.tests, db.attempts, meetings, week);
    const response: Dto<"MeScheduleDayDto">[] = days;
    return HttpResponse.json(response);
  }),

  http.get("*/me/profile", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const meetings = meetingsFor(db.meetings, student);
    const practice = practiceStats(meetings);
    const tests = testsStats(student, db.tests, db.attempts);

    const response: Dto<"MeProfileDto"> = {
      firstName: student.firstName,
      lastName: student.lastName,
      avatarTone: student.avatarTone,
      type: student.type,
      language: student.language,
      access: { status: effectiveAccessStatus(student), daysLeft: daysLeft(student.endDate) },
      startDate: student.startDate,
      endDate: student.endDate,
      phone: student.phone,
      login: student.login,
      lessonsCompleted: student.completed.length,
      lessonsTotal: db.lessons.length,
      testsPassed: tests.passed,
      testsTotal: tests.total,
      practiceTotal: practice.total,
      practiceAttended: practice.attended,
    };
    return HttpResponse.json(response);
  }),
];
