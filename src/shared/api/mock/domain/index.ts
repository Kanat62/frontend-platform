// Порт чистых доменных функций из english-flow/src/lib/store.tsx. Играют роль
// будущего бэкендового `common/domain` (BACKEND.md §6) на время, пока MSW
// изображает бэкенд (ARCHITECTURE.md §7, этап A).
export { effectiveAccessStatus } from "./access";
export { lessonState, progressOf, currentLessonOrder, watchedPctOf } from "./lesson-progress";
export { monthOfLesson, levelForLesson, stageForBlock, stageStatus, courseLevels, levelStatus } from "./program";
export { testForLesson, attemptsFor, activeAttempt, bestAttempt, testAvailability } from "./test-availability";
export { scoreAttempt } from "./test-scoring";
export { nextStepFor, type NextStep } from "./next-step";
export {
  meetingsFor,
  dayAgenda,
  weekAgenda,
  weekPlan,
  activityDatesFor,
  streakDays,
  practiceStats,
  testsStats,
  type DayAgendaItem,
  type WeekDayAgenda,
  type WeekPlanDay,
} from "./schedule";
export { filterStudents, idleActiveStudents, type StudentsQuery } from "./students";
export { attentionBuckets, type AttentionBuckets } from "./attention";
export {
  groupStage,
  teacherOf,
  groupOf,
  studentsInGroup,
  groupIsFull,
  groupHealth,
  idleBucketOf,
  groupWeekSchedule,
  teacherGroupConflict,
  findMatchingGroup,
  type GroupStage,
  type GroupHealth,
} from "./groups";
