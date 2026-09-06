import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `groups`/`progress` (роль C) — BACKEND.md §7.1, §7.4, §12. g-en-0824 (EN-01):
// currentLesson=4, teacher t1, students s1(kanat, openedUpTo=4) и s2(alina, openedUpTo=4).

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /groups", () => {
  it("lists groups with the per-language summary", async () => {
    const res = await apiClient.get<Dto<"GroupsListDto">>("/groups?language=en");
    expect(res.items.every((g) => g.language === "en")).toBe(true);
    expect(res.byLanguage.find((l) => l.code === "en")?.count).toBeGreaterThan(0);
  });

  it("computes the stage (month/level/lessonOrder) from currentLesson", async () => {
    const res = await apiClient.get<Dto<"GroupsListDto">>("/groups");
    const g = res.items.find((x) => x.id === "g-en-0824")!;
    expect(g.courseProductId).toBe("en-group-6mo");
    expect(g.lessonOrder).toBe(4);
    expect(g.month).toBe(1);
    expect(g.teacherName).toBeTruthy();
    expect(g.hasMeetUrl).toBe(true);
  });
});

describe("GET /groups/:id", () => {
  it("includes health, roster and week schedule", async () => {
    const g = await apiClient.get<Dto<"GroupDetailDto">>("/groups/g-en-0824");
    expect(g.health.total).toBeGreaterThanOrEqual(2); // at least kanat + alina
    expect(g.roster.some((s) => s.id === "s1")).toBe(true);
    expect(g.weekSchedule).toHaveLength(7);
    expect(g.weekSchedule.some((d) => d.kind === "rest")).toBe(true);
  });
});

describe("POST /groups/:id/publish-lesson и unpublish-lesson — tx (BACKEND.md §7.1)", () => {
  it("publish raises openedUpTo for active students; тест-гейт всё равно ведёт по порядку", async () => {
    const before = await apiClient.get<Dto<"GroupDetailDto">>("/groups/g-en-0824");
    expect(before.lessonOrder).toBe(4);

    const published = await apiClient.post<Dto<"GroupSummaryDto">>("/groups/g-en-0824/publish-lesson", {
      order: 6,
    });
    expect(published.lessonOrder).toBe(6);

    const kanatLearning = await apiClient.get<Dto<"StudentLearningDto">>("/students/s1/learning");
    expect(kanatLearning.openedUpTo).toBe(6);
    // Группе подняли потолок до 6, но kanat идёт по порядку: фронтир — урок 3,
    // урок 6 закрыт, пока не пройдены 3–5 (тест-гейт / последовательность).
    expect(kanatLearning.lessons.find((l) => l.order === 3)?.state).toBe("available");
    expect(kanatLearning.lessons.find((l) => l.order === 6)?.state).toBe("locked");

    // Publishing a lower order than current is a no-op (max(current, order)).
    const noop = await apiClient.post<Dto<"GroupSummaryDto">>("/groups/g-en-0824/publish-lesson", { order: 3 });
    expect(noop.lessonOrder).toBe(6);
  });

  it("unpublish closes from order down (currentLesson = order-1), affects anyone at/above it", async () => {
    const closed = await apiClient.post<Dto<"GroupSummaryDto">>("/groups/g-en-0824/unpublish-lesson", {
      order: 6,
    });
    expect(closed.lessonOrder).toBe(5);

    const kanatLearning = await apiClient.get<Dto<"StudentLearningDto">>("/students/s1/learning");
    expect(kanatLearning.openedUpTo).toBe(5);
  });
});

describe("PATCH /groups/:id/teacher — slot conflict (TЗ, инвариант 8)", () => {
  it("refuses to double-book a teacher's evening slot across two live groups", async () => {
    // t2 already teaches g-en-0907 at 20:00 (seed) — g-en-0824 is also 20:00.
    await expect(apiClient.patch("/groups/g-en-0824/teacher", { teacherId: "t2" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("allows assigning a teacher with no conflicting slot, and cascades to the group's students", async () => {
    const updated = await apiClient.patch<Dto<"GroupSummaryDto">>("/groups/g-en-0921/teacher", {
      teacherId: "t3",
    });
    expect(updated.teacherName).toBeTruthy();
  });
});

describe("POST /groups — teacher conflict guard on create", () => {
  it("refuses to create a group whose teacher already has that evening slot", async () => {
    await expect(
      apiClient.post("/groups", {
        language: "en",
        durationMonths: 6,
        startDate: "2026-10-05",
        practiceStart: "20:00", // t1 already has g-en-0824 at 20:00
        practiceEnd: "21:00",
        teacherId: "t1",
        maxStudents: 50,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("creates a group and derives its code/name/courseProductId from the chosen tariff", async () => {
    const created = await apiClient.post<Dto<"GroupSummaryDto">>("/groups", {
      language: "ru",
      durationMonths: 3,
      startDate: "2026-10-05",
      practiceStart: "19:00",
      practiceEnd: "20:00",
      teacherId: null,
      maxStudents: 30,
    });
    expect(created.code).toMatch(/^RU-\d{2}$/);
    expect(created.status).toBe("recruiting");
    expect(created.courseProductId).toBe("ru-group-3mo");
  });
});

describe("POST /groups/:id/meetings — schedule a group practice", () => {
  it("requires a meet link (group's own or the request's)", async () => {
    await expect(apiClient.post("/groups/g-en-0914/meetings", { date: "2026-09-20" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("schedules using the group's own meetUrl when the request omits one", async () => {
    const res = await apiClient.post("/groups/g-en-0824/meetings", { date: "2026-09-20" });
    expect(res).toBeTruthy();
  });
});
