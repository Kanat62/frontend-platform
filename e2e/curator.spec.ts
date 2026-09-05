import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

/**
 * Сценарий куратора — TЗ §13.2: войти → Обзор → создать ученика (авто
 * логин/пароль, автоподбор группы, оплата) → на экране группы открыть урок N
 * → назначить преподавателя (проверка слота) → создать практику → отметить
 * `completed` → карточка ученика → заметка → оплата.
 *
 * mock-data.ts: g-en-0824 (EN-02, active, currentLesson=4, teacher t1,
 * активные ученики s1/s2) — для открытия урока. g-en-0914 (EN-04,
 * recruiting, teacherId=null, meetUrl="") и t3 (Азамат Кылычбеков, en+ru, не
 * ведёт ни одной группы в сиде — гарантированно без конфликта слота) — для
 * назначения преподавателя и практики. TODAY зафиксирован в shared/config.
 */

async function login(page: import("@playwright/test").Page) {
  await goto(page, "/login");
  await page.getByPlaceholder(/логин/i).fill("curator");
  await page.getByPlaceholder(/пароль/i).fill("test123");
  await page.getByRole("button", { name: /войти/i }).click();
  await expect(page).toHaveURL("/curator");
}

test("curator golden path: create student -> open lesson -> assign teacher -> schedule + complete practice -> note -> payment", async ({
  page,
}) => {
  await login(page);
  await expect(page.getByText("Добро пожаловать")).toBeVisible();

  // --- Создать ученика: автологин/пароль, автоподбор группы, оплата со слов продаж. ---
  await goto(page, "/curator/students");
  await page.getByRole("button", { name: /добавить ученика/i }).click();

  // Скоуп на форму модалки — на странице ещё есть поле поиска с плейсхолдером,
  // содержащим то же слово «телефону» (без скоупа `getByPlaceholder` неоднозначен).
  const createForm = page.locator("form").filter({ hasText: "Новый ученик" });
  const firstName = `E2E${Date.now() % 100000}`;
  await createForm.getByPlaceholder("Имя").fill(firstName);
  await createForm.getByPlaceholder("Фамилия").fill("Тестов");
  await createForm.getByPlaceholder("Телефон").fill("+996 700 000 001");
  // Язык/формат остаются по умолчанию (English, Group) -> групповое авто-подбор группы на сервере.
  await createForm.getByPlaceholder("Общая сумма").fill("15000");
  await createForm.getByPlaceholder("Первоначальный платёж").fill("5000");
  await createForm.getByRole("button", { name: "Создать", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Ученик создан" })).toBeVisible();
  await expect(page.getByText("Логин", { exact: true })).toBeVisible();
  await expect(page.getByText("Пароль", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Готово" }).click();

  // --- На экране группы открыть урок 6: все активные ученики группы получают openedUpTo=6. ---
  await goto(page, "/curator/groups/g-en-0824");
  // g-en-0824.currentLesson=4 -> уроки 1-4 уже "Открыт", первый "Закрыт" — урок 5,
  // второй (nth(1)) — урок 6, тот, что нам нужен открыть.
  await page.getByRole("button", { name: /закрыт/i }).nth(1).click();
  await expect(page.getByText(/Lesson 6 открыт активным ученикам группы/i)).toBeVisible();

  // --- Назначить преподавателя группе без преподавателя (проверка слота проходит без конфликта). ---
  await goto(page, "/curator/groups/g-en-0914");
  await page.getByRole("button", { name: "Назначить / заменить преподавателя" }).click();
  await page.getByRole("option", { name: "Азамат Кылычбеков" }).click();
  await expect(page.getByText("Преподаватель назначен")).toBeVisible();

  // --- Создать практику (время из группы, ссылка Meet — у этой группы своей ссылки нет). ---
  // Группа не имеет постоянной ссылки — на странице два поля с этим
  // плейсхолдером (форма практики + постоянная ссылка группы), первое — форма.
  await page
    .getByPlaceholder("https://meet.google.com/…")
    .first()
    .fill("https://meet.google.com/e2e-test-practice");
  await page.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page.getByText("Практика назначена группе")).toBeVisible();

  // --- Отметить практику проведённой (Completed) на экране расписания. ---
  // Переход по ссылке (не `goto`/hard reload!) — «база» MSW живёт только в
  // памяти текущей загрузки страницы (shared/api/mock/db.ts), жёсткая
  // перезагрузка ресидит её и стирает только что созданную практику.
  await page.getByRole("link", { name: "Расписание" }).click();
  await expect(page).toHaveURL(/\/curator\/schedule/);
  const practiceRow = page.locator("div.surface-card", { hasText: "EN-04" });
  await practiceRow.locator("select").selectOption("completed");
  await expect(practiceRow.getByText("Проведена")).toBeVisible();

  // --- Карточка ученика: добавить заметку. ---
  await goto(page, "/curator/students/s2");
  await page.getByRole("button", { name: "Заметки", exact: true }).click();
  const noteText = `E2E заметка ${Date.now()}`;
  await page.getByPlaceholder(/внутренняя заметка/i).fill(noteText);
  await page.getByRole("button", { name: /добавить заметку/i }).click();
  await expect(page.getByText("Заметка добавлена")).toBeVisible();
  await expect(page.getByText(noteText)).toBeVisible();

  // --- Обновить оплату. ---
  await page.getByRole("button", { name: "Оплата", exact: true }).click();
  await page.getByLabel("Оплачено").fill("15000");
  await page.getByLabel("Оплачено").blur();
  await expect(page.getByText("Оплата обновлена")).toBeVisible();
  await expect(page.getByText("Оплачено полностью")).toBeVisible();
});
