import type { Dto } from "@/shared/api";

/**
 * Один тест урока конкретного продукта можно переиспользовать в уроке другого
 * продукта (напр. одинаковые уроки EN Group-3мес и EN Group-6мес). Тест жёстко
 * привязан к уроку (`LessonTest.lessonId @unique`), поэтому это **копия**, а не
 * общая ссылка (в отличие от видео в `features/link-lesson-video`): после
 * копирования тесты независимы, правки одного не трогают другой.
 *
 * Эндпоинты (роль CURATOR), реализованы в бэке:
 *   GET  /tests/library
 *     → TestLibraryItemDto[] — тесты всех продуктов с >= 1 вопросом. Каталог доноров.
 *   POST /tests/lesson/:lessonId/copy-from
 *     body: CopyLessonTestRequest → TestEditorDto (та же форма, что редактор).
 *     Переносит в тест целевого урока время, проходной балл, все вопросы и
 *     варианты донора. Если у целевого урока теста ещё нет — создаётся; если
 *     есть — его вопросы заменяются. Статус целевого теста не меняется.
 *     Ошибки: 404 — урок/тест-донор не найден; 400 — у донора нет вопросов;
 *     400 — донор совпадает с целевым уроком.
 */
export type TestLibraryItem = Dto<"TestLibraryItemDto">;
export type CopyLessonTestRequest = Dto<"CopyTestFromRequestDto">;
