import { describe, expect, it } from "vitest";

/**
 * Регресс на найденный в шаге 5 баг: MSW-хендлер с голым a wildcard prefix plus a bare trailing `:id`
 * (без литерального сегмента после `:id`) перехватывал не только реальные
 * API-вызовы, но и собственный dev-time fetch браузера за чанком страницы —
 * `/src/pages/curator/students/index.tsx` структурно неотличим от
 * `<любой префикс>/students/:id`, потому что `:id` без ограничений совпадает
 * с любым сегментом, включая "index.tsx". В деве это ломало react-router
 * `lazy()` именно для /curator/students и /curator/groups — единственных
 * страниц-каталогов, чьё имя папки буквально совпадает с REST-коллекцией
 * (students, groups). Фикс — сузить параметр (`:id([^./]+)`): настоящие id
 * никогда не содержат точку, а "index.tsx" — содержит.
 *
 * Так как MSW-перехват — глобальный (`setupServer` патчит fetch на уровне
 * Node), при ОТСУТСТВИИ совпадения запрос уходит в реальную сеть и падает
 * (по адресу http://localhost ничего не слушает) — это и есть желаемый
 * результат: `fetch` должен ОТКЛОНИТЬСЯ. Если баг вернётся, хендлер поймает
 * запрос и `fetch` благополучно зарезолвится JSON-заглушкой — тест упадёт.
 */
describe("MSW route patterns don't swallow Vite's own module paths", () => {
  const moduleLikePaths = [
    "/src/pages/curator/students/index.tsx",
    "/src/pages/curator/groups/index.tsx",
  ];

  it.each(moduleLikePaths)("GET %s is left unhandled (falls through to the real network)", async (path) => {
    await expect(fetch(`http://localhost${path}`)).rejects.toBeTruthy();
  });
});
