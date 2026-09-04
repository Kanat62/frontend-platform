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
]);
