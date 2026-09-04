import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

// Границы FSD (FRONTEND.md §2, §14). `shared` не обязан иметь единый index.ts
// у каждого сегмента — там уже есть публичные index.ts (ui, lib, config, i18n),
// но сам слой не является «слайсом» в смысле FSD, поэтому public-api для него
// отключаем, как в примере из документации steiger.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ["./src/shared/**"],
    rules: {
      "fsd/public-api": "off",
    },
  },
  {
    // Имена сегментов `app/providers` и `shared/types` зафиксированы в дереве
    // FRONTEND.md §3 — сознательно отступаем от дефолтного списка «плохих» имён
    // steiger (providers/types считаются «техническими», а не по назначению).
    files: ["./src/app/providers/**", "./src/shared/types/**"],
    rules: {
      "fsd/segments-by-purpose": "off",
    },
  },
  {
    // `insignificant-slice` (0-1 ссылок на слайс) отключаем глобально:
    // 1) карта переноса экранов (FRONTEND.md §15, §16) сознательно даёт каждому
    //    основному виджету ровно одну страницу-потребителя (pages — тонкая
    //    композиция, §2.1) — это стабильное свойство архитектуры для всех
    //    18 экранов, а не долг;
    // 2) фронт собирается по шагам (FRONTEND.md §16) — сущность, добавленная на
    //    шаге N, у которой пока один потребитель, вырастет во время шага N+1 (так
    //    было с entities/program). Включать/выключать правило точечно по `files`
    //    нельзя: steiger не засчитывает импорты из файлов с выключенным правилом
    //    как ссылки при подсчёте для ДРУГИХ слайсов — точечное отключение для
    //    widgets/** обнулило счётчик ссылок у entities/lesson и entities/program.
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
