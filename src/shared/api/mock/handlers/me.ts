import { http, HttpResponse, type HttpHandler } from "msw";
import { COMPLETE_THRESHOLD, TODAY } from "@/shared/config";
import { daysLeft, weekRangeOf } from "@/shared/lib";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import {
  currentStudent,
  forbidden,
  lessonsOfProduct,
  notFound,
  productById,
  productIdOfStudent,
  requireActiveAccess,
  testsOfProduct,
  unauthorized,
} from "../context";
import type { Lesson, LessonTest, Meeting, Student } from "../seed-data/mock-data";
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
 * У каждого продукта — свой независимый набор уроков (TЗ §4.1): каждый хендлер
 * сперва резолвит `courseProductId` студента, потом фильтрует `db.lessons`/`db.tests`.
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
function lessonTestSummary(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  order: number,
): Dto<"LessonTestSummaryDto"> | undefined {
  const test = testForLesson(tests, order);
  if (!test) return undefined;
  const availability = testAvailability(student, lessons, test, db.attempts);
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

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const usedBlocks = new Set(lessons.map((l) => l.block));
    const stages = db.stages.filter((s) => usedBlocks.has(s.block));

    const meetings = meetingsFor(db.meetings, student);
    const week = weekRangeOf(TODAY);
    const agenda = weekAgenda(student, lessons, tests, db.attempts, meetings, week);
    const step = nextStepFor(student, lessons, tests, db.attempts, meetings);
    const currentOrder = currentLessonOrder(student, lessons);
    const currentLesson = lessons.find((l) => l.order === currentOrder) ?? null;

    const levels = courseLevels(stages);
    const statusOf = (l: (typeof levels)[number]) => levelStatus(student, lessons, stages, l);
    const currentLevel =
      levels.find((l) => statusOf(l) === "current") ??
      [...levels].reverse().find((l) => statusOf(l) === "completed") ??
      levels[0]!;
    const levelBlocks = stages.filter((s) => s.level === currentLevel).map((s) => s.block);
    const levelLessons = lessons.filter((l) => levelBlocks.includes(l.block));
    const levelDone = levelLessons.filter((l) => student.completed.includes(l.id)).length;
    const percentInLevel = levelLessons.length ? Math.round((levelDone / levelLessons.length) * 100) : 0;
    const streak = streakDays(activityDatesFor(student, db.attempts, meetings));

    let nextStep: Dto<"MeDashboardDto">["nextStep"];
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
        lessonsTotal: lessons.length,
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

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const product = productById(productId);
    const usedBlocks = new Set(lessons.map((l) => l.block));
    const stages = db.stages.filter((s) => usedBlocks.has(s.block));

    const response: Dto<"MeCourseDto"> = {
      language: student.language,
      productTitle: product?.title ?? "",
      completed: student.completed.length,
      total: lessons.length,
      currentLessonOrder: currentLessonOrder(student, lessons),
      blocks: stages.map((stage) => ({
        block: stage.block,
        level: stage.level,
        month: stage.month,
        title: stage.title,
        status: stageStatus(student, lessons, stage),
      })),
    };
    return HttpResponse.json(response);
  }),

  http.get("*/me/lessons", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);

    const response: Dto<"LessonListItemDto">[] = lessons.map((lesson) => {
      const test = lessonTestSummary(student, lessons, tests, lesson.order);
      return {
        ...lessonSummary(lesson),
        block: lesson.block,
        state: lessonState(student, lessons, lesson.order, tests, db.attempts),
        ...(test ? { test } : {}),
      };
    });
    return HttpResponse.json(response);
  }),

  http.get("*/me/lessons/:order([^./]+)", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const order = Number(params.order);
    const lesson = lessons.find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");

    const state = lessonState(student, lessons, order, tests, db.attempts);
    const prevLesson = lessons.find((l) => l.order === order - 1);
    const nextLesson = lessons.find((l) => l.order === order + 1);
    // «Следующий урок закрыт» = его нет ИЛИ он не available под тест-гейтом.
    const nextLocked = nextLesson
      ? lessonState(student, lessons, nextLesson.order, tests, db.attempts) !== "available"
      : true;
    const test = lessonTestSummary(student, lessons, tests, order);

    const response: Dto<"LessonDetailDto"> = {
      ...lessonSummary(lesson),
      block: lesson.block,
      state,
      // Урок «закрыт» — видео не отдаём (то, что гейтит доступ, фронт не пересчитывает).
      // Тестовое видео (TЗ §4.3, курс/preview-video) временно подменяет видео во всех уроках.
      videoUrl: state === "locked" ? "" : (db.previewVideoUrl ?? lesson.videoUrl),
      watchedPct: watchedPctOf(student, lessons, order),
      ...(prevLesson ? { prev: { order: prevLesson.order, title: prevLesson.title } } : {}),
      ...(nextLesson ? { next: { order: nextLesson.order, title: nextLesson.title } } : {}),
      nextLocked,
      ...(test ? { test } : {}),
    };
    return HttpResponse.json(response);
  }),

  http.post("*/me/lessons/:order/watch", async ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();
    const guard = requireActiveAccess(student);
    if (guard) return guard;

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const order = Number(params.order);
    const lesson = lessons.find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");
    // Закрыт группой ИЛИ тест-гейтом (не сдан тест предыдущего урока).
    if (lessonState(student, lessons, order, tests, db.attempts) === "locked") {
      return forbidden("Урок пока закрыт");
    }

    const body = (await request.json()) as Dto<"WatchProgressRequestDto">;
    const wasCompleted = student.completed.includes(lesson.id);
    let completedJustNow = false;

    // Порт `updateWatchProgress`/`completeLesson` из store.tsx (BACKEND.md §7.2):
    // прогресс — максимум с уже сохранённым; завершение — авто при пересечении порога.
    student.watched = { ...student.watched, [lesson.id]: Math.max(student.watched[lesson.id] ?? 0, body.pct) };
    if (!wasCompleted && body.pct / 100 >= COMPLETE_THRESHOLD) {
      student.completed = [...student.completed, lesson.id];
      student.completedAt = { ...student.completedAt, [lesson.id]: TODAY };
      student.watched = { ...student.watched, [lesson.id]: 100 };
      completedJustNow = true;
    }
    student.lastActivity = TODAY;

    const response: Dto<"WatchProgressResponseDto"> = {
      watchedPct: watchedPctOf(student, lessons, order),
      state: lessonState(student, lessons, order, tests, db.attempts),
      completedJustNow,
    };
    return HttpResponse.json(response);
  }),

  http.get("*/me/schedule", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const meetings = meetingsFor(db.meetings, student);
    const week = weekRangeOf(TODAY);
    const days = weekPlan(student, lessons, tests, db.attempts, meetings, week);
    const response: Dto<"MeScheduleDayDto">[] = days;
    return HttpResponse.json(response);
  }),

  http.get("*/me/profile", ({ request }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const productId = productIdOfStudent(student);
    const tests = testsOfProduct(productId);
    const meetings = meetingsFor(db.meetings, student);
    const practice = practiceStats(meetings);
    const testsStatsResult = testsStats(student, tests, db.attempts);

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
      lessonsTotal: lessonsOfProduct(productId).length,
      testsPassed: testsStatsResult.passed,
      testsTotal: testsStatsResult.total,
      practiceTotal: practice.total,
      practiceAttended: practice.attended,
    };
    return HttpResponse.json(response);
  }),
];
