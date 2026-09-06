// Сид-данные для MSW. Копия english-flow/src/lib/mock-data.ts (FRONTEND.md §13),
// расширенная до 6 CourseProduct (EN/RU × Group-3мес/Group-6мес/Individual-1мес),
// каждый со своим независимым набором уроков — как backend/prisma/seed-data/*
// (BACKEND.md §13) — единственный источник моковых данных для shared/api/mock/db.ts
// и handlers/*. Не импортировать напрямую из entities/features/widgets — только
// через MSW db. Тестовые данные платформы (без бэкенда).

export type Role = "student" | "curator";
export type CourseType = "GROUP" | "INDIVIDUAL";
export type AccessStatus = "active" | "expired" | "disabled";
export type LessonState = "locked" | "available" | "completed";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type QuestionType = "single" | "multiple";
export type TestStatus = "draft" | "published";
export type AttemptStatus = "in_progress" | "submitted";

/* ---------- академия: язык · курс · группа · преподаватель ---------- */

export type LanguageCode = "en" | "ru";
export type GroupStatus = "recruiting" | "active" | "finished" | "archived";
export type TeacherStatus = "active" | "absent" | "replacement";
export type PaymentStatus = "full" | "partial" | "unpaid";

export interface Language {
  code: LanguageCode;
  name: string;
  nameRu: string;
}

export interface CourseProduct {
  id: string;
  language: LanguageCode;
  format: CourseType;
  title: string;
  durationMonths: number;
  price: number;
  currency: string;
  features: string[];
  /** Шаблон программы: месяц → уровень CEFR. Настройка курса, а не жёсткое условие. */
  levelPlan: { month: number; level: CefrLevel }[];
}

export interface Teacher {
  id: string;
  name: string;
  languages: LanguageCode[];
  status: TeacherStatus;
  phone: string;
  tone: string;
}

export interface Group {
  id: string;
  /** Короткий код потока для различения: EN-01, RU-01, … */
  code: string;
  /** Понятное человеку название, напр. «EN-01 · Английский язык · 07.09.2026 · 20:00». */
  name: string;
  language: LanguageCode;
  /** Тариф группы (3 или 6 месяцев) — определяет и `courseProductId`, и длину программы. */
  durationMonths: number;
  /** Категория курса этой группы — у каждой свой независимый набор уроков (TЗ §4.1). */
  courseProductId: string;
  startDate: string;
  endDate: string;
  /** Вечерний слот практики хранится в группе, а не в коде. */
  practiceStart: string;
  practiceEnd: string;
  teacherId: string | null;
  maxStudents: number;
  status: GroupStatus;
  /** Общий текущий учебный этап группы (order урока её продукта). Прогресс ученика — отдельно. */
  currentLesson: number;
  meetUrl: string;
}

export interface PaymentInfo {
  totalCost: number;
  paid: number;
  purchaseDate: string;
  status: PaymentStatus;
}

export interface Lesson {
  id: string;
  /** Категория курса, которой принадлежит урок — `order` уникален только внутри неё. */
  courseProductId: string;
  order: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  block: string;
}

export interface Meeting {
  id: string;
  /** Категория курса практики — нужна, чтобы отличить урок с тем же `order` в другом продукте. */
  courseProductId: string;
  lessonOrder: number;
  studentId: string | "group";
  /** Практика группового курса привязана к конкретной группе. */
  groupId: string | null;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  meetUrl: string;
  type: CourseType;
  status: MeetingStatus;
  /** Отмеченные преподавателем/куратором id учеников (attendance). */
  attended?: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  options: QuestionOption[];
}

export interface LessonTest {
  id: string;
  /** Источник истины — конкретный урок конкретного продукта (BACKEND.md: `Lesson.id` FK). */
  lessonId: string;
  /** Денормализованный `order` урока — только для отображения (BACKEND.md §12, TestEditorDto). */
  lessonOrder: number;
  title: string;
  timeLimitSec: number;
  passingScore: number; // 0-100
  status: TestStatus;
  questions: TestQuestion[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  /** Урок, к которому относится тест — по `Lesson.id` (BACKEND.md: `TestAttempt.lessonId`). */
  lessonId: string;
  studentId: string;
  startedAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
  submittedAt: string | null;
  answers: Record<string, string[]>; // questionId -> selected optionIds
  correctCount: number | null;
  totalQuestions: number;
  score: number | null; // 0-100
  passed: boolean | null;
  status: AttemptStatus;
}

export interface Note {
  id: string;
  studentId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Student {
  id: string;
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  language: LanguageCode;
  type: CourseType;
  age: number | null;
  city: string;
  /** Группа (только для группового курса). Индивидуальный — null. */
  groupId: string | null;
  /** Преподаватель. У Individual назначается напрямую; у Group берётся из группы. */
  teacherId: string | null;
  startDate: string;
  endDate: string;
  status: AccessStatus;
  openedUpTo: number; // максимальный открытый урок (order — в рамках продукта ученика)
  /** Завершённые уроки — по `Lesson.id`, не по `order` (у разных продуктов order пересекается). */
  completed: string[];
  completedAt: Record<string, string>; // lessonId -> дата завершения (YYYY-MM-DD)
  watched: Record<string, number>; // lessonId -> % просмотра видео (0-100)
  lastActivity: string;
  avatarTone: string;
  onboarded: boolean;
  managerName: string;
  payment: PaymentInfo;
}

/* ---------- программа: темы группового и индивидуального курса ---------- */
// Копия backend/prisma/seed-data/curriculum.ts (BACKEND.md §13) — контент не
// различается по языку обучения (демо-плейсхолдер), но каждый продукт получает
// свой независимый набор уроков (§4.1 TЗ).

const GROUP_TITLES: [string, string, string][] = [
  ["Знакомство и алфавит", "Greetings, the alphabet and first phrases", "Foundation"],
  ["Verb to be", "Am / is / are в утверждении и отрицании", "Foundation"],
  ["Личные местоимения", "I, you, he, she, it, we, they", "Foundation"],
  ["Артикли a / an / the", "Когда нужен артикль и когда его нет", "Foundation"],
  ["Множественное число", "Regular and irregular plurals", "Foundation"],
  ["This / that / these / those", "Указательные местоимения в речи", "Foundation"],
  ["Числа и время", "Numbers, dates and telling the time", "Foundation"],
  ["Present Simple", "Ежедневные действия и расписание", "Grammar Core"],
  ["Present Simple: вопросы", "Do / does и порядок слов", "Grammar Core"],
  ["Наречия частотности", "Always, usually, sometimes, never", "Grammar Core"],
  ["Present Continuous", "Действия в момент речи", "Grammar Core"],
  ["Simple vs Continuous", "Разница между двумя временами", "Grammar Core"],
  ["Предлоги места", "In, on, at, under, between", "Grammar Core"],
  ["There is / there are", "Описание комнаты и города", "Grammar Core"],
  ["Модальный глагол can", "Способности и просьбы", "Grammar Core"],
  ["Past Simple: to be", "Was / were в рассказе о прошлом", "Past & Future"],
  ["Past Simple: правильные глаголы", "Окончание -ed и произношение", "Past & Future"],
  ["Present Perfect", "Опыт и результат в настоящем", "Past & Future"],
  ["Present Perfect vs Past Simple", "Когда какое время выбрать", "Past & Future"],
  ["Неправильные глаголы", "Топ-50 форм для разговора", "Past & Future"],
  ["Past Continuous", "Фон и длительное действие в прошлом", "Past & Future"],
  ["Future: will", "Решения, прогнозы и обещания", "Past & Future"],
  ["Future: going to", "Планы и намерения", "Past & Future"],
  ["Present для будущего", "Расписания и договорённости", "Past & Future"],
  ["Степени сравнения", "Comparatives and superlatives", "Vocabulary"],
  ["Countable / uncountable", "Some, any, much, many", "Vocabulary"],
  ["Еда и заказ в кафе", "Ordering food like a local", "Vocabulary"],
  ["Путешествия", "Airport, hotel, directions", "Vocabulary"],
  ["Работа и профессии", "Talking about your job", "Vocabulary"],
  ["Семья и отношения", "Describing people you love", "Vocabulary"],
  ["Внешность и характер", "Adjectives for people", "Vocabulary"],
  ["Дом и быт", "Household vocabulary", "Vocabulary"],
  ["Погода и природа", "Small talk about weather", "Vocabulary"],
  ["Шопинг", "Prices, sizes, returns", "Vocabulary"],
  ["Здоровье", "At the doctor's", "Vocabulary"],
  ["Модальные глаголы", "Must, should, have to", "Advanced Grammar"],
  ["Условные предложения 0 и 1", "Real conditionals", "Advanced Grammar"],
  ["Условные предложения 2", "Unreal present", "Advanced Grammar"],
  ["Пассивный залог", "Passive voice basics", "Advanced Grammar"],
  ["Косвенная речь", "Reported speech", "Advanced Grammar"],
  ["Герундий и инфинитив", "-ing or to do", "Advanced Grammar"],
  ["Фразовые глаголы", "Top 30 phrasal verbs", "Advanced Grammar"],
  ["Артикли: сложные случаи", "Geographical names and idioms", "Advanced Grammar"],
  ["Связки в речи", "Linking words for fluency", "Speaking"],
  ["Small talk", "Как начать и держать разговор", "Speaking"],
  ["Телефонный разговор", "Phone English", "Speaking"],
  ["Деловая переписка", "Emails that work", "Speaking"],
  ["Собеседование", "Job interview practice", "Speaking"],
  ["Презентация", "Presenting your idea", "Speaking"],
  ["Спор и аргументация", "Agreeing and disagreeing", "Speaking"],
  ["Идиомы", "Natural everyday idioms", "Speaking"],
  ["Произношение", "Sounds English learners miss", "Speaking"],
  ["Аудирование", "Understanding fast speech", "Speaking"],
  ["Финальный разбор", "Итоговая практика курса", "Speaking"],
];

// TODO(content): заглушка — точное количество и содержание уроков для Individual
// (1 месяц, полностью отдельная программа) уточнить отдельно. Пока ~12 интенсивных тем.
const INDIVIDUAL_TITLES: [string, string, string][] = [
  ["Стартовая диагностика", "Оценка уровня и постановка цели курса", "Intensive"],
  ["Разговорный минимум", "Ключевые фразы для первого разговора", "Intensive"],
  ["Грамматический каркас", "Базовые конструкции для быстрого старта", "Intensive"],
  ["Повседневная лексика", "Слова и фразы на каждый день", "Intensive"],
  ["Практика диалога 1", "Отработка живого диалога с преподавателем", "Intensive"],
  ["Работа и профессии", "Лексика для рабочих ситуаций", "Intensive"],
  ["Практика диалога 2", "Усложнённые повседневные ситуации", "Intensive"],
  ["Свободное время", "Разговор о хобби и планах", "Intensive"],
  ["Деловое общение", "Email и короткие созвоны", "Intensive"],
  ["Практика диалога 3", "Импровизация без подготовки", "Intensive"],
  ["Итоговое ускорение", "Разбор ошибок и точечная доработка", "Intensive"],
  ["Финальная практика", "Итоговый разговор с преподавателем", "Intensive"],
];

/** Стабильный id урока внутри продукта — `lesson-<courseProductId>-<order>`. */
export function lessonId(courseProductId: string, order: number): string {
  return `lesson-${courseProductId}-${order}`;
}

function lessonsFor(
  courseProductId: string,
  titles: [string, string, string][],
): Omit<Lesson, "videoUrl" | "duration">[] {
  return titles.map(([title, description, block], i) => ({
    id: lessonId(courseProductId, i + 1),
    courseProductId,
    order: i + 1,
    title,
    description,
    block,
  }));
}

export const LESSONS: Lesson[] = [
  ...lessonsFor("en-group-6mo", GROUP_TITLES),
  ...lessonsFor("en-group-3mo", GROUP_TITLES.slice(0, 27)),
  ...lessonsFor("ru-group-6mo", GROUP_TITLES),
  ...lessonsFor("ru-group-3mo", GROUP_TITLES.slice(0, 27)),
  ...lessonsFor("en-individual-1mo", INDIVIDUAL_TITLES),
  ...lessonsFor("ru-individual-1mo", INDIVIDUAL_TITLES),
].map((lesson, i) => ({
  ...lesson,
  videoUrl: "/Video%20Project%201.mp4",
  duration: `${10 + ((i * 7) % 12)}:${String((i * 13) % 60).padStart(2, "0")}`,
}));

export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export interface CourseStage {
  block: string; // соответствует Lesson.block
  level: CefrLevel;
  month: number;
  title: string;
}

// Текущий блок программы отображается как этап роадмапа — это шаблон
// программы месяц-к-уровню, а не автоматическое определение уровня. Блоки
// группового курса + отдельный блок Individual-программы (не привязан к месяцам).
export const COURSE_STAGES: CourseStage[] = [
  { block: "Foundation", level: "A1", month: 1, title: "Foundation" },
  { block: "Grammar Core", level: "A2", month: 2, title: "Everyday Grammar" },
  { block: "Past & Future", level: "B1", month: 3, title: "Past & Future" },
  { block: "Vocabulary", level: "B1", month: 4, title: "Vocabulary & Life" },
  { block: "Advanced Grammar", level: "B2", month: 5, title: "Advanced Grammar" },
  { block: "Speaking", level: "B2", month: 6, title: "Speaking & Fluency" },
  { block: "Intensive", level: "A1", month: 1, title: "Intensive" },
];

/* ---------- языки ---------- */

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nameRu: "Английский язык" },
  { code: "ru", name: "Russian", nameRu: "Русский язык" },
];

export function languageName(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
export function languageNameRu(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code)?.nameRu ?? code;
}

/* ---------- курсы (продукты) ---------- */
// Копия backend/prisma/seed-data/curriculum.ts COURSE_PRODUCTS — 6 категорий:
// EN/RU × Group-3мес/Group-6мес/Individual-1мес, каждая со своим набором уроков.

const GROUP_6MO_LEVEL_PLAN: { month: number; level: CefrLevel }[] = [
  { month: 1, level: "A1" },
  { month: 2, level: "A2" },
  { month: 3, level: "B1" },
  { month: 4, level: "B1" },
  { month: 5, level: "B2" },
  { month: 6, level: "B2" },
];

const GROUP_3MO_LEVEL_PLAN: { month: number; level: CefrLevel }[] = GROUP_6MO_LEVEL_PLAN.slice(0, 3);

const INDIVIDUAL_LEVEL_PLAN: { month: number; level: CefrLevel }[] = [{ month: 1, level: "A1" }];

const GROUP_FEATURES = ["Теория", "Тесты", "Повторение", "Групповая практика", "Преподаватель", "Google Meet"];
const INDIVIDUAL_FEATURES = ["Индивидуальная практика с преподавателем", "Отдельная интенсивная программа"];

export const COURSE_PRODUCTS: CourseProduct[] = [
  {
    id: "en-group-6mo",
    language: "en",
    format: "GROUP",
    title: "English Group · 6 месяцев",
    durationMonths: 6,
    price: 15000,
    currency: "сом",
    features: GROUP_FEATURES,
    levelPlan: GROUP_6MO_LEVEL_PLAN,
  },
  {
    id: "en-group-3mo",
    language: "en",
    format: "GROUP",
    title: "English Group · 3 месяца",
    durationMonths: 3,
    price: 9000,
    currency: "сом",
    features: GROUP_FEATURES,
    levelPlan: GROUP_3MO_LEVEL_PLAN,
  },
  {
    id: "ru-group-6mo",
    language: "ru",
    format: "GROUP",
    title: "Russian Group · 6 месяцев",
    durationMonths: 6,
    price: 12000,
    currency: "сом",
    features: GROUP_FEATURES,
    levelPlan: GROUP_6MO_LEVEL_PLAN,
  },
  {
    id: "ru-group-3mo",
    language: "ru",
    format: "GROUP",
    title: "Russian Group · 3 месяца",
    durationMonths: 3,
    price: 7500,
    currency: "сом",
    features: GROUP_FEATURES,
    levelPlan: GROUP_3MO_LEVEL_PLAN,
  },
  {
    id: "en-individual-1mo",
    language: "en",
    format: "INDIVIDUAL",
    title: "English Individual",
    durationMonths: 1,
    price: 20000,
    currency: "сом",
    features: INDIVIDUAL_FEATURES,
    levelPlan: INDIVIDUAL_LEVEL_PLAN,
  },
  {
    id: "ru-individual-1mo",
    language: "ru",
    format: "INDIVIDUAL",
    title: "Russian Individual",
    durationMonths: 1,
    price: 20000,
    currency: "сом",
    features: INDIVIDUAL_FEATURES,
    levelPlan: INDIVIDUAL_LEVEL_PLAN,
  },
];

/** Резолвит id продукта по языку+формату(+длительности для GROUP) — как backend/course-resolver. */
export function productIdFor(language: LanguageCode, format: CourseType, durationMonths: number): string {
  const product = COURSE_PRODUCTS.find(
    (p) => p.language === language && p.format === format && p.durationMonths === durationMonths,
  );
  if (!product) {
    throw new Error(`Не найден CourseProduct для ${language}/${format}/${durationMonths}мес`);
  }
  return product.id;
}

/* ---------- преподаватели ---------- */

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "Айжан Осмонова", languages: ["en"], status: "active", phone: "+996 700 010 011", tone: "var(--tone-1)" },
  { id: "t2", name: "Бек Турдубеков", languages: ["en"], status: "active", phone: "+996 700 010 022", tone: "var(--tone-2)" },
  { id: "t3", name: "Азамат Кылычбеков", languages: ["en", "ru"], status: "replacement", phone: "+996 700 010 033", tone: "var(--tone-3)" },
  { id: "t4", name: "Динара Асанова", languages: ["ru"], status: "active", phone: "+996 700 010 044", tone: "var(--tone-4)" },
  { id: "t5", name: "Гульнара Садыкова", languages: ["ru"], status: "absent", phone: "+996 700 010 055", tone: "var(--tone-5)" },
  { id: "t6", name: "Мээрим Абдыраева", languages: ["en", "ru"], status: "active", phone: "+996 700 010 066", tone: "var(--tone-2)" },
];

/* ---------- группы ---------- */

export function groupCodePrefix(language: LanguageCode) {
  return language === "en" ? "EN" : "RU";
}

/** Следующий свободный код потока для языка: EN-01, EN-02, … */
export function nextGroupCode(groups: Group[], language: LanguageCode) {
  const prefix = groupCodePrefix(language);
  const used = groups
    .filter((g) => g.language === language)
    .map((g) => Number(g.code.split("-")[1]) || 0);
  const n = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

export function groupName(code: string, language: LanguageCode, startDate: string, time: string) {
  const d = new Date(startDate);
  const label = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  return `${code} · ${languageNameRu(language)} · ${label} · ${time}`;
}

function endAfterMonths(startDate: string, months: number) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function makeGroup(
  id: string,
  language: LanguageCode,
  startDate: string,
  practiceStart: string,
  practiceEnd: string,
  teacherId: string | null,
  status: GroupStatus,
  currentLesson: number,
  meetUrl: string,
  maxStudents = 50,
  durationMonths = 6,
): Omit<Group, "code" | "name"> {
  return {
    id,
    language,
    durationMonths,
    courseProductId: productIdFor(language, "GROUP", durationMonths),
    startDate,
    endDate: endAfterMonths(startDate, durationMonths),
    practiceStart,
    practiceEnd,
    teacherId,
    maxStudents,
    status,
    currentLesson,
    meetUrl,
  };
}

/** Нумерует потоки по языку в порядке даты старта: EN-01, EN-02, … / RU-01, … */
function assignGroupCodes(rows: Omit<Group, "code" | "name">[]): Group[] {
  const counters: Record<string, number> = {};
  const codeById: Record<string, string> = {};
  for (const g of [...rows].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const prefix = groupCodePrefix(g.language);
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    codeById[g.id] = `${prefix}-${String(counters[prefix]).padStart(2, "0")}`;
  }
  return rows.map((g) => {
    const code = codeById[g.id]!;
    return { ...g, code, name: groupName(code, g.language, g.startDate, g.practiceStart) };
  });
}

export const GROUPS: Group[] = assignGroupCodes([
  makeGroup("g-en-0824", "en", "2026-08-18", "20:00", "21:00", "t1", "active", 4, "https://meet.google.com/eng-0818-grp"),
  makeGroup("g-en-0907", "en", "2026-09-07", "20:00", "21:00", "t2", "recruiting", 1, "https://meet.google.com/eng-0907-grp"),
  makeGroup("g-en-0914", "en", "2026-09-14", "21:00", "22:00", null, "recruiting", 1, ""),
  makeGroup("g-en-0921", "en", "2026-09-21", "21:00", "22:00", null, "recruiting", 1, "https://meet.google.com/eng-0921-grp"),
  makeGroup("g-ru-0824", "ru", "2026-08-18", "20:00", "21:00", "t4", "active", 4, "https://meet.google.com/rus-0818-grp"),
  makeGroup("g-ru-0907", "ru", "2026-09-07", "20:00", "21:00", "t5", "recruiting", 1, ""),
  makeGroup("g-ru-0914", "ru", "2026-09-14", "21:00", "22:00", null, "recruiting", 1, "https://meet.google.com/rus-0914-grp"),
  makeGroup("g-en-0518", "en", "2026-05-10", "21:00", "22:00", "t1", "finished", 54, "https://meet.google.com/eng-old-grp"),
  // Демо-группы на 3-месячном тарифе — для ручной проверки per-product сценариев (BACKEND.md §13).
  makeGroup("g-en-0928", "en", "2026-09-28", "19:00", "20:00", "t2", "recruiting", 1, "https://meet.google.com/eng-0928-grp", 50, 3),
  makeGroup("g-ru-0928", "ru", "2026-09-28", "19:00", "20:00", "t5", "recruiting", 1, "https://meet.google.com/rus-0928-grp", 50, 3),
]);

/* ---------- ученики ---------- */

function payment(total: number, paid: number, purchaseDate: string): PaymentInfo {
  return {
    totalCost: total,
    paid,
    purchaseDate,
    status: paid >= total ? "full" : paid > 0 ? "partial" : "unpaid",
  };
}

const CITIES = ["Бишкек", "Ош", "Джалал-Абад", "Каракол", "Токмок", "Нарын", "Талас", "Баткен"];
const FIRST_NAMES = ["Айгерим", "Нурбек", "Азиз", "Салтанат", "Тимур", "Жамиля", "Эрлан", "Гулназ", "Максат", "Асель", "Бакыт", "Динара", "Руслан", "Чолпон", "Данияр", "Айпери", "Кубат", "Мээрим", "Улан", "Назгуль"];
const LAST_NAMES = ["Абдиев", "Токтосунова", "Мамытов", "Исакова", "Орозов", "Бекова", "Сыдыков", "Алиева", "Жумабаев", "Турсунова", "Касымов", "Эргешова", "Досов", "Бейшеналиева", "Уметалиев", "Кадырова"];

// Продукты сид-учеников ниже (по их groupId/type) — для справки при чтении completed/watched:
// s1, s2 -> en-group-6mo (g-en-0824); s3 -> en-individual-1mo; s4 -> en-group-6mo (g-en-0518); s5 -> ru-individual-1mo.
const HAND_STUDENTS: Student[] = [
  {
    id: "s1", login: "kanat", password: "test123", firstName: "Канат", lastName: "Уметов",
    phone: "+996 700 112 233", language: "en", type: "GROUP", age: 27, city: "Бишкек",
    groupId: "g-en-0824", teacherId: "t1", startDate: "2026-08-18", endDate: "2027-02-18",
    status: "active", openedUpTo: 4,
    completed: [lessonId("en-group-6mo", 1), lessonId("en-group-6mo", 2)],
    completedAt: { [lessonId("en-group-6mo", 1)]: "2026-08-18", [lessonId("en-group-6mo", 2)]: "2026-08-20" },
    watched: { [lessonId("en-group-6mo", 3)]: 40 }, lastActivity: "2026-08-18", avatarTone: "var(--tone-1)", onboarded: true,
    managerName: "Нурбол", payment: payment(15000, 15000, "2026-08-10"),
  },
  {
    id: "s2", login: "alina", password: "test123", firstName: "Алина", lastName: "Ким",
    phone: "+996 555 908 771", language: "en", type: "GROUP", age: 24, city: "Бишкек",
    groupId: "g-en-0824", teacherId: "t1", startDate: "2026-08-18", endDate: "2027-02-18",
    status: "active", openedUpTo: 4,
    completed: [lessonId("en-group-6mo", 1), lessonId("en-group-6mo", 2), lessonId("en-group-6mo", 3)],
    completedAt: {
      [lessonId("en-group-6mo", 1)]: "2026-08-18",
      [lessonId("en-group-6mo", 2)]: "2026-08-19",
      [lessonId("en-group-6mo", 3)]: "2026-08-21",
    },
    watched: {}, lastActivity: "2026-08-17", avatarTone: "var(--tone-2)", onboarded: true,
    managerName: "Нурбол", payment: payment(15000, 7500, "2026-08-11"),
  },
  {
    id: "s3", login: "aibek", password: "test123", firstName: "Айбек", lastName: "Сатыбалдиев",
    phone: "+996 707 445 010", language: "en", type: "INDIVIDUAL", age: 31, city: "Ош",
    groupId: null, teacherId: "t2", startDate: "2026-08-05", endDate: "2026-09-05",
    status: "active", openedUpTo: 7,
    completed: [1, 2, 3, 4, 5, 6].map((o) => lessonId("en-individual-1mo", o)),
    completedAt: { [lessonId("en-individual-1mo", 1)]: "2026-08-05" },
    watched: { [lessonId("en-individual-1mo", 7)]: 60 }, lastActivity: "2026-08-18", avatarTone: "var(--tone-3)", onboarded: true,
    managerName: "Нурбол", payment: payment(20000, 20000, "2026-08-01"),
  },
  {
    id: "s4", login: "nurai", password: "test123", firstName: "Нурай", lastName: "Асанова",
    phone: "+996 559 220 118", language: "en", type: "GROUP", age: 29, city: "Каракол",
    groupId: "g-en-0518", teacherId: "t1", startDate: "2026-05-10", endDate: "2026-11-10",
    status: "expired", openedUpTo: 54,
    completed: Array.from({ length: 40 }, (_, i) => lessonId("en-group-6mo", i + 1)),
    completedAt: {}, watched: {}, lastActivity: "2026-08-09", avatarTone: "var(--tone-4)", onboarded: true,
    managerName: "Азамат", payment: payment(15000, 15000, "2026-05-02"),
  },
  {
    id: "s5", login: "elmira", password: "test123", firstName: "Эльмира", lastName: "Джолдошева",
    phone: "+996 700 330 447", language: "ru", type: "INDIVIDUAL", age: 22, city: "Джалал-Абад",
    groupId: null, teacherId: "t4", startDate: "2026-08-12", endDate: "2026-09-12",
    status: "disabled", openedUpTo: 1, completed: [], completedAt: {}, watched: {},
    lastActivity: "2026-08-14", avatarTone: "var(--tone-5)", onboarded: false,
    managerName: "Нурбол", payment: payment(20000, 5000, "2026-08-12"),
  },
];

const TONES = ["var(--tone-1)", "var(--tone-2)", "var(--tone-3)", "var(--tone-4)", "var(--tone-5)"];

function generateStudents(count: number): Student[] {
  const recruitingGroups = GROUPS.filter((g) => g.status === "recruiting" || g.status === "active");
  const out: Student[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + 6;
    const language: LanguageCode = i % 3 === 0 ? "ru" : "en";
    const isIndividual = i % 7 === 0;
    const type: CourseType = isIndividual ? "INDIVIDUAL" : "GROUP";
    const pool = recruitingGroups.filter((g) => g.language === language);
    const group = !isIndividual && pool.length ? pool[i % pool.length]! : null;
    // Продукт — из фактически подобранной группы (её тариф может быть 3 или 6 месяцев),
    // а не угадан по языку+формату (BACKEND.md: CourseResolverService.forStudent).
    const productId = isIndividual
      ? productIdFor(language, "INDIVIDUAL", 1)
      : (group?.courseProductId ?? productIdFor(language, "GROUP", 6));
    const product = COURSE_PRODUCTS.find((p) => p.id === productId)!;
    const startDate = group ? group.startDate : "2026-08-20";
    const openedUpTo = group ? group.currentLesson : 1 + (i % 6);
    const completedCount = Math.max(0, Math.min(openedUpTo - 1, (i * 3) % (openedUpTo + 1)));
    const status: AccessStatus = i % 13 === 0 ? "expired" : i % 17 === 0 ? "disabled" : "active";
    const lastActivity =
      i % 5 === 0 ? "2026-08-12" : i % 3 === 0 ? "2026-08-16" : i % 2 === 0 ? "2026-08-17" : "2026-08-18";
    const teacherId = isIndividual
      ? (TEACHERS.filter((t) => t.languages.includes(language))[i % 2]?.id ?? null)
      : (group?.teacherId ?? null);
    const paid = i % 4 === 0 ? Math.round(product.price * 0.3) : product.price;
    out.push({
      id: `s${n}`,
      login: `student${n}`,
      password: "test123",
      firstName: FIRST_NAMES[i % FIRST_NAMES.length]!,
      lastName: LAST_NAMES[i % LAST_NAMES.length]!,
      phone: `+996 ${500 + (i % 99)} ${100 + (i % 800)} ${100 + (i % 800)}`,
      language,
      type,
      age: 18 + (i % 30),
      city: CITIES[i % CITIES.length]!,
      groupId: group?.id ?? null,
      teacherId,
      startDate,
      endDate: endAfterMonths(startDate, product.durationMonths),
      status,
      openedUpTo,
      completed: Array.from({ length: completedCount }, (_, k) => lessonId(productId, k + 1)),
      completedAt: {},
      watched: completedCount < openedUpTo ? { [lessonId(productId, openedUpTo)]: (i * 17) % 100 } : {},
      lastActivity,
      avatarTone: TONES[i % TONES.length]!,
      onboarded: i % 6 !== 0,
      managerName: ["Нурбол", "Азамат", "Салима"][i % 3]!,
      payment: payment(product.price, paid, startDate),
    });
  }
  return out;
}

export const STUDENTS: Student[] = [...HAND_STUDENTS, ...generateStudents(46)];

export const CURATOR = {
  id: "c1",
  login: "curator",
  password: "test123",
  name: "Мээрим Абдыраева",
  role: "curator" as Role,
};

const EN_GROUP_6MO = "en-group-6mo";
const RU_GROUP_6MO = "ru-group-6mo";
const EN_INDIVIDUAL_1MO = "en-individual-1mo";

export const MEETINGS: Meeting[] = [
  {
    id: "m1",
    courseProductId: EN_GROUP_6MO,
    lessonOrder: 4,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Артикли a / an / the",
    date: "2026-08-19",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m2",
    courseProductId: EN_GROUP_6MO,
    lessonOrder: 5,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Множественное число",
    date: "2026-08-21",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m3",
    courseProductId: EN_GROUP_6MO,
    lessonOrder: 3,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Личные местоимения",
    date: "2026-08-17",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "completed",
    attended: ["s1", "s2"],
  },
  {
    id: "m4",
    courseProductId: RU_GROUP_6MO,
    lessonOrder: 4,
    studentId: "group",
    groupId: "g-ru-0824",
    title: "Практика: Русский · Lesson 4",
    date: "2026-08-19",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/rus-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m5",
    courseProductId: EN_INDIVIDUAL_1MO,
    lessonOrder: 7,
    studentId: "s3",
    groupId: null,
    title: "Индивидуальная практика: Числа и время",
    date: "2026-08-19",
    startTime: "19:00",
    endTime: "20:00",
    meetUrl: "https://meet.google.com/ind-aibek-01",
    type: "INDIVIDUAL",
    status: "scheduled",
  },
];

export const NOTES: Note[] = [
  {
    id: "n1",
    studentId: "s1",
    author: "Мээрим Абдыраева",
    content:
      "Ученик хорошо понимает теорию, но испытывает сложности с разговорной речью. Обратить внимание на Past Simple, vocabulary и уверенность в speaking.",
    createdAt: "2026-08-16",
  },
  {
    id: "n2",
    studentId: "s3",
    author: "Мээрим Абдыраева",
    content: "Очень мотивирован, просит больше домашней практики. Можно ускорить темп.",
    createdAt: "2026-08-14",
  },
];

function makeQuestion(
  order: number,
  text: string,
  correctIndex: number,
  options: string[],
): TestQuestion {
  return {
    id: `l1q${order}`,
    text,
    type: "single",
    order,
    options: options.map((o, i) => ({
      id: `l1q${order}o${i + 1}`,
      text: o,
      isCorrect: i === correctIndex,
    })),
  };
}

export const TESTS: LessonTest[] = [
  {
    id: "test-1",
    lessonId: lessonId(EN_GROUP_6MO, 1),
    lessonOrder: 1,
    title: "Тест к уроку 1",
    timeLimitSec: 300,
    passingScore: 70,
    status: "published",
    questions: [
      makeQuestion(1, "What is your name?", 0, [
        "My name is Anna.",
        "I name Anna.",
        "Me is Anna.",
        "My names Anna.",
      ]),
      makeQuestion(2, "How are you?", 0, [
        "Fine, thank you.",
        "I'm 20 years.",
        "I am from Bishkek.",
        "My name is Kanat.",
      ]),
      makeQuestion(3, "Choose the correct greeting for the morning.", 1, [
        "Good night",
        "Good morning",
        "Good evening",
        "Goodbye",
      ]),
      makeQuestion(4, 'Which letter comes after "D" in the English alphabet?', 2, [
        "C",
        "F",
        "E",
        "B",
      ]),
      makeQuestion(5, '"___ you later" — choose the correct word.', 3, [
        "Hello",
        "Please",
        "Sorry",
        "See",
      ]),
      makeQuestion(6, 'Choose the correct response to "Nice to meet you".', 0, [
        "Nice to meet you too.",
        "You are welcome.",
        "I'm sorry.",
        "Good luck.",
      ]),
      makeQuestion(7, "Which word is a polite way to say goodbye?", 1, [
        "Hi",
        "Bye",
        "What",
        "Yes",
      ]),
      makeQuestion(8, 'Complete: "Thank you very ___."', 2, ["good", "well", "much", "nice"]),
    ],
  },
];

export const TEST_ATTEMPTS: TestAttempt[] = [
  // Канат (s1) сдал тест урока 1 на проходной балл — благодаря этому его урок 3
  // открыт (тест-гейт, ТЗ инвариант 4). У Алины (s2) попытки нет: она завершила
  // уроки, но тест 1 не сдан — её следующий урок закрыт до сдачи.
  {
    id: "attempt-s1-test1",
    testId: "test-1",
    lessonId: lessonId(EN_GROUP_6MO, 1),
    studentId: "s1",
    startedAt: "2026-08-19T10:00:00.000Z",
    expiresAt: "2026-08-19T10:05:00.000Z",
    submittedAt: "2026-08-19T10:03:30.000Z",
    answers: {},
    correctCount: 7,
    totalQuestions: 8,
    score: 88,
    passed: true,
    status: "submitted",
  },
];

export const TODAY = "2026-08-18";
