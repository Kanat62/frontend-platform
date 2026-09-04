/**
 * Ручной контракт API — по BACKEND.md §12 (Request/Response DTO), пока нет
 * реального бэкенда. Форма — как у `openapi-typescript` (`components.schemas.*`),
 * чтобы замена на сгенерированный `schema.gen.ts` (ARCHITECTURE.md §2) не требовала
 * переписывать типы в entities (model/types.ts). Дополняется по мере разработки модулей
 * (FRONTEND.md §16) — дополняется по шагам, сейчас auth + кабинет ученика (чтение).
 */

export type Role = "student" | "curator";
export type LanguageCode = "en" | "ru";
export type CourseType = "GROUP" | "INDIVIDUAL";
export type AccessStatus = "active" | "expired" | "disabled";
export type CefrLevel = "A1" | "A2" | "B1" | "B2";
export type LessonState = "locked" | "available" | "completed";
export type StageStatus = "locked" | "current" | "completed";
export type TestAvailability = "locked" | "available" | "in_progress" | "passed" | "failed";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type WeekPlanKind = "theory" | "practice" | "rest";
export type WeekPlanStatus = "done" | "past" | "today" | "upcoming" | "locked" | "rest";
export type DayItemKind = "lesson" | "test" | "practice";
export type DayItemStatus = "done" | "missed" | "scheduled" | "cancelled";

export interface components {
  schemas: {
    LoginRequestDto: {
      login: string;
      password: string;
    };

    /** Минимум, нужный кабинету ученика в шапке/сайдбаре (BACKEND.md §4, Student). */
    StudentSelfDto: {
      id: string;
      firstName: string;
      lastName: string;
      avatarTone: string;
      type: CourseType;
      language: LanguageCode;
    };

    /**
     * У кураторов в этом продукте нет отдельной сущности с профилем (TЗ §3.2 —
     * единый аккаунт `curator`) — минимальная витрина для шелла.
     */
    CuratorSelfDto: {
      id: string;
      name: string;
    };

    AuthUserDto: {
      id: string;
      role: Role;
      student?: components["schemas"]["StudentSelfDto"];
      curator?: components["schemas"]["CuratorSelfDto"];
    };

    LoginResponseDto: {
      accessToken: string;
      user: components["schemas"]["AuthUserDto"];
    };

    RefreshResponseDto: {
      accessToken: string;
    };

    /** Общий вид доступа — переиспользуется в dashboard/profile (BACKEND.md §6, access.ts). */
    AccessInfoDto: {
      status: AccessStatus;
      daysLeft: number;
    };

    /** Минимум для ссылок/превью урока (карточки «след./пред.», nextStep). */
    LessonSummaryDto: {
      order: number;
      title: string;
      description: string;
      duration: string;
    };

    /** Встроенный в урок статус теста — без отдельного запроса (шаг 3, FRONTEND.md §16). */
    LessonTestSummaryDto: {
      title: string;
      questionCount: number;
      minutes: number;
      availability: TestAvailability;
      bestScore?: number;
    };

    LessonListItemDto: components["schemas"]["LessonSummaryDto"] & {
      block: string;
      state: LessonState;
      test?: components["schemas"]["LessonTestSummaryDto"];
    };

    LessonDetailDto: components["schemas"]["LessonSummaryDto"] & {
      block: string;
      state: LessonState;
      videoUrl: string;
      watchedPct: number;
      prev?: { order: number; title: string };
      next?: { order: number; title: string };
      nextLocked: boolean;
      test?: components["schemas"]["LessonTestSummaryDto"];
    };

    MeetingSummaryDto: {
      id: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      meetUrl: string;
      status: MeetingStatus;
      type: CourseType;
      lessonOrder: number;
    };

    DayAgendaItemDto: {
      kind: DayItemKind;
      status: DayItemStatus;
      title: string;
      subtitle: string;
      time?: string;
      meetUrl?: string;
      lessonOrder: number;
    };

    NextStepDto:
      | { kind: "lesson"; lesson: components["schemas"]["LessonSummaryDto"] }
      | {
          kind: "test";
          lesson: components["schemas"]["LessonSummaryDto"];
          test: { questionCount: number; minutes: number };
        }
      | { kind: "practice"; meeting: components["schemas"]["MeetingSummaryDto"] }
      | { kind: "done"; nextMeeting?: components["schemas"]["MeetingSummaryDto"] };

    LevelStatusDto: {
      level: CefrLevel;
      status: StageStatus;
    };

    MeDashboardDto: {
      firstName: string;
      courseType: CourseType;
      learningLanguage: LanguageCode;
      access: components["schemas"]["AccessInfoDto"];
      week: { date: string; items: components["schemas"]["DayAgendaItemDto"][] }[];
      currentLesson: components["schemas"]["LessonSummaryDto"] | null;
      nextStep: components["schemas"]["NextStepDto"];
      /** Встречи ученика — для клиентского превью дня при клике в «Моей неделе» (FRONTEND.md §7). */
      meetings: components["schemas"]["MeetingSummaryDto"][];
      progress: {
        level: CefrLevel;
        percentInLevel: number;
        lessonsDone: number;
        lessonsTotal: number;
        streakDays: number;
        /** TODO(TЗ §15.4): «Точность 87%» захардкожена в референсе — воспроизведено как есть. */
        accuracyPct: number;
        /** TODO(TЗ §15.4): «180 дней доступа» захардкожено в референсе (не путать с AccessInfoDto.daysLeft). */
        daysLeftAccess: number;
        levels: components["schemas"]["LevelStatusDto"][];
      };
    };

    MeCourseBlockDto: {
      block: string;
      level: CefrLevel;
      month: number;
      title: string;
      status: StageStatus;
    };

    MeCourseDto: {
      language: LanguageCode;
      productTitle: string;
      completed: number;
      total: number;
      /** Для подсветки текущей строки в course-lesson-list (тот же расчёт, что и в dashboard). */
      currentLessonOrder: number;
      blocks: components["schemas"]["MeCourseBlockDto"][];
    };

    MeScheduleDayDto: {
      date: string;
      weekday: string;
      kind: WeekPlanKind;
      status: WeekPlanStatus;
      title: string;
      topic: string;
      meta: string;
      meetUrl?: string;
      lessonOrder?: number;
    };

    MeProfileDto: {
      firstName: string;
      lastName: string;
      avatarTone: string;
      type: CourseType;
      language: LanguageCode;
      access: components["schemas"]["AccessInfoDto"];
      startDate: string;
      endDate: string;
      phone: string;
      login: string;
      lessonsCompleted: number;
      lessonsTotal: number;
      testsPassed: number;
      testsTotal: number;
      practiceTotal: number;
      practiceAttended: number;
    };
  };
}

export type Dto<K extends keyof components["schemas"]> = components["schemas"][K];
