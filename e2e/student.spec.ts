import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

/**
 * Сценарий ученика — TЗ §13.1: войти → Dashboard («Моя неделя» + «Следующий
 * шаг») → открыть урок → посмотреть видео (≥90% → авто-завершение) → пройти
 * тест → увидеть результат → увидеть ближайшую практику → Google Meet →
 * прогресс. Плюс отдельно: истёкший доступ сохраняет данные (последний блок
 * TЗ §13.1).
 *
 * kanat (s1, mock-data.ts): completed=[1,2], openedUpTo=4, watched={3:40} —
 * урок 3 доступен, не завершён; урок 1 уже завершён и имеет опубликованный
 * тест (единственный сеяный тест). TODAY зафиксирован в shared/config
 * (2026-08-18), сценарий детерминирован независимо от реальной даты запуска.
 */

async function login(page: import("@playwright/test").Page, loginName: string, password = "test123") {
  await goto(page, "/login");
  await page.getByPlaceholder(/логин/i).fill(loginName);
  await page.getByPlaceholder(/пароль/i).fill(password);
  await page.getByRole("button", { name: /войти/i }).click();
}

test("student golden path: dashboard -> watch to auto-complete -> take test -> result -> practice -> progress", async ({
  page,
}) => {
  await login(page, "kanat");
  await expect(page).toHaveURL("/");

  // Dashboard: «Моя неделя» + «Следующий шаг».
  await expect(page.getByText("Моя неделя")).toBeVisible();
  await expect(page.getByText("Следующий шаг")).toBeVisible();

  // Открыть урок 3 (доступен, но не завершён — watched=40%).
  await goto(page, "/lesson/3");
  const video = page.locator("video");
  await expect(video).toBeVisible();

  // Досмотреть до 95% (порог автозавершения — 90%, TЗ §6.5) без реального
  // проигрывания 15-секундного файла. Headless Chromium репортит для этого
  // файла `seekable = [[0,0]]` (буфер полный, но диапазон перемотки пуст —
  // квирк headless-декодера), так что просто выставить `currentTime` не
  // работает: значение молча откатывается к 0. Вместо реальной перемотки
  // подменяем геттер `currentTime` — тестируем логику `useTrackWatchProgress`
  // (она читает `currentTarget.currentTime/duration` из события), а не
  // видео-движок браузера.
  await video.evaluate((el: HTMLVideoElement) => {
    return new Promise<void>((resolve) => {
      const finish = () => {
        const realDuration = el.duration;
        Object.defineProperty(el, "currentTime", {
          configurable: true,
          get: () => realDuration * 0.95,
          set: () => {},
        });
        el.dispatchEvent(new Event("timeupdate"));
        resolve();
      };
      if (el.readyState >= 1 && el.duration) finish();
      else el.addEventListener("loadedmetadata", finish, { once: true });
    });
  });
  // Именно тост (не статичная плашка «Урок завершён» урока) — подтверждает
  // `completedJustNow`, а не то, что урок уже был завершён раньше.
  await expect(page.getByText(/вы посмотрели 90%\+ видео/i)).toBeVisible({ timeout: 10_000 });

  // Пройти тест урока 1 (уже завершён, тест опубликован — единственный сеяный).
  await goto(page, "/lesson/1/test");
  await page.getByRole("button", { name: /начать тест/i }).click();

  // Ответы 1-8 из mock-data.ts (correctIndex 0,0,1,2,3,0,1,2) -> все верные.
  const correctAnswers = [
    "My name is Anna.",
    "Fine, thank you.",
    "Good morning",
    "E",
    "See",
    "Nice to meet you too.",
    "Bye",
    "much",
  ];
  for (const answer of correctAnswers) {
    await page.getByRole("button", { name: answer, exact: true }).click();
  }
  await page.getByRole("button", { name: /отправить тест/i }).click();

  // Результат.
  await expect(page.getByText("Тест завершён")).toBeVisible();
  await expect(page.getByText("8 / 8")).toBeVisible();
  await expect(page.getByText("Тест пройден")).toBeVisible();

  // Ближайшая практика -> ссылка на Google Meet.
  await goto(page, "/schedule");
  const meetLink = page.locator('a[href*="meet.google.com"]').first();
  await expect(meetLink).toBeVisible();
  await expect(meetLink).toHaveAttribute("target", "_blank");

  // Прогресс по уровню — профиль.
  await goto(page, "/profile");
  await expect(page.getByText("Уроки")).toBeVisible();
  await expect(page.getByText(/^\d+ \/ 54$/)).toBeVisible();
});

test("expired access: student can still log in and see preserved historical progress", async ({ page }) => {
  // s4 (Нурай, mock-data.ts): status="expired", 40 завершённых уроков.
  await login(page, "nurai");
  await expect(page).toHaveURL("/");

  await expect(page.getByText(/срок обучения закончился|истёк/i).first()).toBeVisible();

  // Данные сохранены — прогресс всё ещё виден, не обнулён (completed = 40 уроков).
  await goto(page, "/profile");
  await expect(page.getByText("40 / 54")).toBeVisible();
});
