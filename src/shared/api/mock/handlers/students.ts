import { http, HttpResponse, type HttpHandler } from "msw";
import { PAGE_SIZE, TODAY } from "@/shared/config";
import { daysLeft, generatePassword } from "@/shared/lib";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import {
  badRequest,
  lessonsOfProduct,
  notFound,
  productById,
  productIdOfStudent,
  requireCurator,
  testsOfProduct,
} from "../context";
import { productIdFor, type Student } from "../seed-data/mock-data";
import {
  bestAttempt,
  currentLessonOrder,
  effectiveAccessStatus,
  filterStudents,
  findMatchingGroup,
  groupOf,
  lessonState,
  levelForLesson,
  meetingsFor,
  monthOfLesson,
  practiceStats,
  progressOf,
  teacherOf,
  testsStats,
  type StudentsQuery,
} from "../domain";

/**
 * `students` (роль C) — BACKEND.md §12. Список/детали/мутации ученика.
 * Один эндпоинт на вкладку карточки (`overview/learning/practice/progress`) —
 * так задокументировано в BACKEND.md; данные шапки карточки (общие для всех
 * вкладок) — отдельный `GET /students/:id`. У каждого продукта — свой набор
 * уроков (TЗ §4.1): хендлеры резолвят `courseProductId` ученика перед чтением
 * `db.lessons`/`db.tests`.
 */

function paymentInfo(student: Student, currency: string): Dto<"PaymentInfoDto"> {
  const p = student.payment;
  return {
    status: p.status,
    paid: p.paid,
    total: p.totalCost,
    currency,
    remaining: Math.max(0, p.totalCost - p.paid),
    purchaseDate: p.purchaseDate,
  };
}

function studentListItem(student: Student): Dto<"StudentListItemDto"> {
  const productId = productIdOfStudent(student);
  const product = productById(productId);
  const lessons = lessonsOfProduct(productId);
  const group = student.groupId ? db.groups.find((g) => g.id === student.groupId) : undefined;
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    avatarTone: student.avatarTone,
    login: student.login,
    phone: student.phone,
    language: student.language,
    type: student.type,
    productTitle: product?.title ?? "",
    groupCode: group?.code ?? null,
    groupName: group?.name ?? null,
    startDate: student.startDate,
    endDate: student.endDate,
    currentLessonOrder: currentLessonOrder(student, lessons),
    lessonsTotal: lessons.length,
    progressPct: progressOf(student, lessons),
    payment: paymentInfo(student, product?.currency ?? "сом"),
    lastActivity: student.lastActivity,
    accessStatus: effectiveAccessStatus(student),
  };
}

function studentHeader(student: Student): Dto<"StudentHeaderDto"> {
  const lessons = lessonsOfProduct(productIdOfStudent(student));
  const meetings = meetingsFor(db.meetings, student);
  const nextMeeting = meetings.find((m) => m.status === "scheduled" && m.date >= TODAY);
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    avatarTone: student.avatarTone,
    language: student.language,
    type: student.type,
    accessStatus: effectiveAccessStatus(student),
    status: student.status,
    daysLeft: daysLeft(student.endDate),
    endDate: student.endDate,
    lastActivity: student.lastActivity,
    currentLessonOrder: currentLessonOrder(student, lessons),
    openedUpTo: student.openedUpTo,
    lessonsTotal: lessons.length,
    progressPct: progressOf(student, lessons),
    onboarded: student.onboarded,
    ...(nextMeeting ? { nextMeeting: { date: nextMeeting.date, startTime: nextMeeting.startTime } } : {}),
  };
}

export const studentsHandlers: HttpHandler[] = [
  http.get("*/students", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const url = new URL(request.url);
    const query: StudentsQuery = {
      q: url.searchParams.get("q") ?? "",
      language: (url.searchParams.get("language") ?? "all") as StudentsQuery["language"],
      type: (url.searchParams.get("type") ?? "all") as StudentsQuery["type"],
      status: (url.searchParams.get("status") ?? "all") as StudentsQuery["status"],
      groupId: url.searchParams.get("groupId") ?? "all",
      teacherId: url.searchParams.get("teacherId") ?? "all",
    };
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);

    const filtered = filterStudents(db.students, query);
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const response: Dto<"StudentsListDto"> = {
      items: pageItems.map(studentListItem),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
    };
    return HttpResponse.json(response);
  }),

  http.post("*/students", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const body = (await request.json()) as Dto<"CreateStudentRequestDto">;
    if (!body.firstName?.trim()) return badRequest("Укажите имя ученика");
    if (!body.login?.trim()) return badRequest("Укажите логин");
    if (db.students.some((s) => s.login === body.login)) {
      return badRequest("Такой логин уже есть в базе — измените");
    }

    let group = body.groupId ? (db.groups.find((g) => g.id === body.groupId) ?? null) : null;
    if (body.type === "GROUP" && !group) {
      group = findMatchingGroup(db.groups, db.students, body.language, body.startDate, body.practiceStart) ?? null;
    }
    // Продукт — из фактической группы (её тариф может быть 3 или 6 месяцев), а не
    // угадан по языку+формату (BACKEND.md: CourseResolverService.forStudent).
    const productId =
      body.type === "INDIVIDUAL" ? productIdFor(body.language, "INDIVIDUAL", 1) : (group?.courseProductId ?? productIdFor(body.language, "GROUP", 6));
    const product = productById(productId)!;
    const start = group ? group.startDate : body.startDate;
    const end = new Date(start);
    end.setMonth(end.getMonth() + product.durationMonths);
    const total = body.total ?? product.price;
    const paid = body.paid ?? 0;
    // Пароль приходит с формы (клиентский предпросмотр, как в референсе); если по
    // какой-то причине пуст — генерируем на сервере, чтобы учётка не осталась без пароля.
    const password = body.password?.trim() || generatePassword(new Set(db.students.map((s) => s.password)));

    const student: Student = {
      id: `s-${Date.now()}`,
      login: body.login,
      password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      language: body.language,
      type: body.type,
      age: body.age,
      city: body.city,
      groupId: group?.id ?? null,
      teacherId: group?.teacherId ?? null,
      startDate: start,
      endDate: end.toISOString().slice(0, 10),
      status: "active",
      openedUpTo: 1,
      completed: [],
      completedAt: {},
      watched: {},
      lastActivity: TODAY,
      avatarTone: "var(--tone-3)",
      onboarded: false,
      managerName: body.manager || "—",
      payment: {
        totalCost: total,
        paid,
        purchaseDate: TODAY,
        status: paid >= total ? "full" : paid > 0 ? "partial" : "unpaid",
      },
    };
    db.students.unshift(student);

    const response: Dto<"CreateStudentResponseDto"> = {
      id: student.id,
      login: student.login,
      password,
      groupName: group?.name ?? null,
    };
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get("*/students/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");
    return HttpResponse.json(studentHeader(student));
  }),

  http.get("*/students/:id/overview", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const product = productById(productIdOfStudent(student))!;
    const group = groupOf(db.groups, student);
    const teacher = teacherOf(db.teachers, student.teacherId);

    const response: Dto<"StudentOverviewDto"> = {
      login: student.login,
      // MSW legacy: пароли в моках не храним, отдаём заглушку.
      password: `${student.login}-pass`,
      phone: student.phone,
      age: student.age,
      city: student.city,
      managerName: student.managerName,
      productTitle: product.title,
      productPrice: product.price,
      productCurrency: product.currency,
      startDate: student.startDate,
      endDate: student.endDate,
      payment: paymentInfo(student, product.currency),
      group: group ? { id: group.id, name: group.name } : null,
      groupRequired: student.type === "GROUP",
      teacherName: teacher?.name ?? null,
    };
    return HttpResponse.json(response);
  }),

  http.get("*/students/:id/learning", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const product = productById(productId)!;
    const order = currentLessonOrder(student, lessons);
    const tests = testsOfProduct(productId);
    const ts = testsStats(student, tests, db.attempts);

    const response: Dto<"StudentLearningDto"> = {
      level: levelForLesson(product, order, lessons.length),
      month: monthOfLesson(order, lessons.length, product.durationMonths),
      currentLessonOrder: order,
      openedUpTo: student.openedUpTo,
      completedCount: student.completed.length,
      testsPassed: ts.passed,
      testsTotal: ts.total,
      lessons: lessons.map((l) => {
        const t = tests.find((x) => x.lessonOrder === l.order);
        const best = t ? bestAttempt(db.attempts, student.id, t.id) : null;
        return {
          order: l.order,
          title: l.title,
          state: lessonState(student, lessons, l.order, tests, db.attempts),
          test: t
            ? {
                published: t.status === "published",
                bestScore: best?.score ?? null,
                passed: best?.passed ?? null,
                passingScore: t.passingScore,
              }
            : null,
        };
      }),
    };
    return HttpResponse.json(response);
  }),

  http.get("*/students/:id/practice", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const meetings = meetingsFor(db.meetings, student);
    const ps = practiceStats(meetings);
    const nextMeeting = meetings.find((m) => m.status === "scheduled" && m.date >= TODAY);

    const response: Dto<"StudentPracticeDto"> = {
      total: ps.total,
      attended: ps.attended,
      ...(nextMeeting ? { nextMeetingDate: nextMeeting.date } : {}),
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        meetUrl: m.meetUrl,
        status: m.status,
        ...(m.status === "completed" ? { attended: (m.attended ?? []).includes(student.id) } : {}),
      })),
    };
    return HttpResponse.json(response);
  }),

  http.get("*/students/:id/progress", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const productId = productIdOfStudent(student);
    const meetings = meetingsFor(db.meetings, student);
    const ps = practiceStats(meetings);
    const ts = testsStats(student, testsOfProduct(productId), db.attempts);

    const response: Dto<"StudentProgressDto"> = {
      completedCount: student.completed.length,
      lessonsTotal: lessonsOfProduct(productId).length,
      progressPct: progressOf(student, lessonsOfProduct(productId)),
      testsPassed: ts.passed,
      testsTotal: ts.total,
      practiceAttended: ps.attended,
      practiceTotal: ps.total,
      // Порт значения из curator.students.$id.tsx: там это подписано «Streak», но
      // считает не серию активных дней (как streakDays на дашборде ученика), а
      // дни с последней активности — воспроизведено как в референсе.
      streakDays: Math.max(0, daysLeft(TODAY, student.lastActivity)),
    };
    return HttpResponse.json(response);
  }),

  http.patch("*/students/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const body = (await request.json()) as Dto<"UpdateStudentRequestDto">;
    if (body.phone !== undefined) student.phone = body.phone;
    if (body.city !== undefined) student.city = body.city;
    if (body.age !== undefined) student.age = body.age;
    if (body.managerName !== undefined) student.managerName = body.managerName;
    if (body.onboarded !== undefined) student.onboarded = body.onboarded;
    if (body.payment) {
      const { total, paid } = body.payment;
      student.payment = {
        ...student.payment,
        totalCost: total,
        paid,
        status: paid >= total ? "full" : paid > 0 ? "partial" : "unpaid",
      };
    }
    return HttpResponse.json(studentHeader(student));
  }),

  http.patch("*/students/:id/access", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const body = (await request.json()) as Dto<"UpdateStudentAccessRequestDto">;
    if (body.status !== undefined) student.status = body.status;
    if (body.endDate !== undefined) student.endDate = body.endDate;
    return HttpResponse.json(studentHeader(student));
  }),

  http.patch("*/students/:id/group", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const body = (await request.json()) as Dto<"UpdateStudentGroupRequestDto">;
    const group = body.groupId ? (db.groups.find((g) => g.id === body.groupId) ?? null) : null;
    student.groupId = body.groupId;
    if (group) {
      student.teacherId = group.teacherId;
      student.startDate = group.startDate;
      student.endDate = group.endDate;
    }
    return HttpResponse.json(studentHeader(student));
  }),

  http.post("*/students/bulk", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const body = (await request.json()) as Dto<"BulkUpdateStudentsRequestDto">;

    for (const student of db.students) {
      if (!body.ids.includes(student.id)) continue;
      if (body.patch.groupId !== undefined) {
        const group = body.patch.groupId ? (db.groups.find((g) => g.id === body.patch.groupId) ?? null) : null;
        student.groupId = body.patch.groupId;
        student.teacherId = group ? group.teacherId : student.teacherId;
      } else if (body.patch.teacherId !== undefined) {
        student.teacherId = body.patch.teacherId;
      }
      if (body.patch.status !== undefined) student.status = body.patch.status;
    }
    return HttpResponse.json({ updated: body.ids.length });
  }),

  // Individual-переключатель открытия уроков (BACKEND.md §7.1) — не подключён в
  // UI референса (TЗ §15.6), но контракт готов на будущее.
  http.post("*/students/:id/open-lesson", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");
    if (student.type !== "INDIVIDUAL") return badRequest("Доступно только для Individual");

    const lessons = lessonsOfProduct(productIdOfStudent(student));
    const body = (await request.json()) as Dto<"OpenCloseLessonRequestDto">;
    if (body.order < 1 || body.order > lessons.length) return badRequest("Некорректный номер урока");
    student.openedUpTo = body.order;
    return HttpResponse.json(studentHeader(student));
  }),

  http.post("*/students/:id/close-lesson", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");
    if (student.type !== "INDIVIDUAL") return badRequest("Доступно только для Individual");

    const body = (await request.json()) as Dto<"OpenCloseLessonRequestDto">;
    student.openedUpTo = Math.max(0, body.order - 1);
    return HttpResponse.json(studentHeader(student));
  }),
];
