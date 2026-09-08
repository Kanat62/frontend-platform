import type { Dto } from "@/shared/api";

/**
 * Одно видео Bunny — на уроки разных продуктов (одинаковые уроки EN Group-3мес и
 * EN Group-6мес, аналогично RU) без повторной заливки: и место в CDN, и время
 * кодирования. Проигрывание идёт по `Lesson.videoAssetId` (GUID Bunny);
 * webhook/`reconcile` уже обновляют ВСЕ строки `Lesson` с этим GUID
 * (`updateMany`), поэтому «шеринг» — это лишь копия ссылки на GUID из
 * урока-донора в целевой урок.
 *
 * Эндпоинты (роль CURATOR), реализованы в бэке:
 *   GET  /courses/video-library
 *     → VideoLibraryItem[] — уроки всех продуктов со статусом видео
 *       ready/processing. Каталог доноров.
 *   POST /courses/products/:productId/lessons/:order/video/link-from
 *     body: LinkLessonVideoRequest → LessonEditorDto (та же форма, что редактор).
 *     Копирует в целевой урок videoAssetId + videoStatus + videoDurationSec
 *     + duration (+ fallback videoUrl). Bunny не трогается. Повторная заливка
 *     видео на одном из уроков разводит их обратно.
 *     Ошибки: 404 — урок/донор не найден; 400 — у донора нет готового видео;
 *     400 — донор совпадает с целевым уроком.
 */
export type VideoLibraryItem = Dto<"VideoLibraryItemDto">;
export type LinkLessonVideoRequest = Dto<"LinkLessonVideoRequestDto">;
