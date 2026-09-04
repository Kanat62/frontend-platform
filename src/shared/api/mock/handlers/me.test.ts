import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// Регрессия на вычисляемые поля `/me/*` для сид-ученика kanat (s1):
// openedUpTo=4, completed=[1,2], watched={3:40} — mock-data.ts.

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "kanat",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /me/lessons", () => {
  it("computes lessonState from openedUpTo/completed", async () => {
    const lessons = await apiClient.get<Dto<"LessonListItemDto">[]>("/me/lessons");
    expect(lessons).toHaveLength(54);
    const byOrder = (o: number) => lessons.find((l) => l.order === o)!;
    expect(byOrder(1).state).toBe("completed");
    expect(byOrder(2).state).toBe("completed");
    expect(byOrder(3).state).toBe("available");
    expect(byOrder(4).state).toBe("available");
    expect(byOrder(5).state).toBe("locked");
  });

  it("embeds a test summary only for lesson 1 (the only seeded published test)", async () => {
    const lessons = await apiClient.get<Dto<"LessonListItemDto">[]>("/me/lessons");
    const lesson1 = lessons.find((l) => l.order === 1)!;
    expect(lesson1.test?.questionCount).toBe(8);
    // completed(1) + published test -> available (нет ещё попыток)
    expect(lesson1.test?.availability).toBe("available");
  });
});

describe("GET /me/lessons/:order", () => {
  it("returns watchedPct and prev/next for an available lesson", async () => {
    const lesson = await apiClient.get<Dto<"LessonDetailDto">>("/me/lessons/3");
    expect(lesson.state).toBe("available");
    expect(lesson.watchedPct).toBe(40);
    expect(lesson.prev).toEqual({ order: 2, title: expect.any(String) });
    expect(lesson.next).toEqual({ order: 4, title: expect.any(String) });
    expect(lesson.nextLocked).toBe(false); // next.order(4) <= openedUpTo(4)
    expect(lesson.videoUrl).not.toBe("");
  });

  it("hides the video and reports locked state for a locked lesson", async () => {
    const lesson = await apiClient.get<Dto<"LessonDetailDto">>("/me/lessons/5");
    expect(lesson.state).toBe("locked");
    expect(lesson.videoUrl).toBe("");
  });
});

describe("GET /me/dashboard", () => {
  it("resumes the next incomplete opened lesson as nextStep", async () => {
    const dashboard = await apiClient.get<Dto<"MeDashboardDto">>("/me/dashboard");
    expect(dashboard.firstName).toBe("Канат");
    expect(dashboard.nextStep.kind).toBe("lesson");
    if (dashboard.nextStep.kind === "lesson") {
      expect(dashboard.nextStep.lesson.order).toBe(3);
    }
    expect(dashboard.currentLesson?.order).toBe(3);
    expect(dashboard.progress.level).toBe("A1");
    expect(dashboard.progress.lessonsDone).toBe(2);
    expect(dashboard.progress.accuracyPct).toBe(87);
    expect(dashboard.progress.daysLeftAccess).toBe(180);
    expect(dashboard.week).toHaveLength(7);
  });
});

describe("GET /me/course", () => {
  it("reports the product and per-block status", async () => {
    const course = await apiClient.get<Dto<"MeCourseDto">>("/me/course");
    expect(course.productTitle).toBe("English Group");
    expect(course.completed).toBe(2);
    expect(course.total).toBe(54);
    expect(course.blocks.find((b) => b.block === "Foundation")?.status).toBe("current");
  });
});

describe("GET /me/schedule", () => {
  it("returns a 7-day plan", async () => {
    const days = await apiClient.get<Dto<"MeScheduleDayDto">[]>("/me/schedule");
    expect(days).toHaveLength(7);
    expect(days.some((d) => d.kind === "rest")).toBe(true);
  });
});

describe("GET /me/profile", () => {
  it("reports contact info and stats", async () => {
    const profile = await apiClient.get<Dto<"MeProfileDto">>("/me/profile");
    expect(profile.login).toBe("kanat");
    expect(profile.lessonsCompleted).toBe(2);
    expect(profile.access.status).toBe("active");
  });
});
