import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `meetings` — BACKEND.md §7.5, §12. TODAY=2026-08-18 (shared/config/constants.ts).
// Сид: m1/m2 (g-en-0824, scheduled), m3 (g-en-0824, completed, attended=[s1,s2]),
// m4 (g-ru-0824, scheduled), m5 (individual s3, scheduled) — все в диапазоне
// «эта неделя», ни одна не датирована ровно TODAY.

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /meetings?range=", () => {
  it("today is empty (no seeded meeting lands exactly on TODAY)", async () => {
    const res = await apiClient.get<Dto<"ScheduleMeetingDto">[]>("/meetings?range=today");
    expect(res).toEqual([]);
  });

  it("week includes the seeded group and individual meetings, with resolved names", async () => {
    const res = await apiClient.get<Dto<"ScheduleMeetingDto">[]>("/meetings?range=week");
    const m1 = res.find((m) => m.id === "m1")!;
    expect(m1.scope).toBe("GROUP");
    expect(m1.groupName).toBeTruthy();
    expect(m1.teacherName).toBeTruthy();

    const m5 = res.find((m) => m.id === "m5")!;
    expect(m5.scope).toBe("INDIVIDUAL");
    expect(m5.studentName).toBeTruthy();
    expect(m5.roster).toHaveLength(1);
  });

  it("exposes attendance already recorded on a completed group meeting", async () => {
    const res = await apiClient.get<Dto<"ScheduleMeetingDto">[]>("/meetings?range=week");
    const m3 = res.find((m) => m.id === "m3")!;
    expect(m3.status).toBe("completed");
    const present = m3.roster.filter((r) => r.present).map((r) => r.id);
    expect(present.sort()).toEqual(["s1", "s2"]);
  });
});

describe("POST /meetings", () => {
  it("schedules a group practice, falling back to the group's own meetUrl", async () => {
    const created = await apiClient.post<Dto<"ScheduleMeetingDto">>("/meetings", {
      scope: "GROUP",
      groupId: "g-en-0824",
      date: "2026-08-20",
    });
    expect(created.scope).toBe("GROUP");
    expect(created.meetUrl).toBeTruthy();
  });

  it("requires a group id and rejects otherwise", async () => {
    await expect(
      apiClient.post("/meetings", { scope: "GROUP", date: "2026-08-20" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("schedules an individual practice with explicit time and link", async () => {
    const created = await apiClient.post<Dto<"ScheduleMeetingDto">>("/meetings", {
      scope: "INDIVIDUAL",
      studentId: "s1",
      date: "2026-08-20",
      startTime: "18:00",
      endTime: "19:00",
      meetUrl: "https://meet.google.com/ind-kanat",
    });
    expect(created.scope).toBe("INDIVIDUAL");
    expect(created.studentName).toContain("Канат");
    expect(created.startTime).toBe("18:00");
  });

  it("requires an explicit time and link for individual practices", async () => {
    await expect(
      apiClient.post("/meetings", { scope: "INDIVIDUAL", studentId: "s1", date: "2026-08-20" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("PATCH /meetings/:id", () => {
  it("updates the status", async () => {
    const updated = await apiClient.patch<Dto<"ScheduleMeetingDto">>("/meetings/m1", { status: "cancelled" });
    expect(updated.status).toBe("cancelled");
  });
});

describe("PATCH /meetings/:id/attendance", () => {
  it("marks and unmarks a student as present (s2 is a member of m1's group, g-en-0824)", async () => {
    const marked = await apiClient.patch<Dto<"ScheduleMeetingDto">>("/meetings/m1/attendance", {
      studentId: "s2",
      present: true,
    });
    expect(marked.roster.find((r) => r.id === "s2")?.present).toBe(true);

    const unmarked = await apiClient.patch<Dto<"ScheduleMeetingDto">>("/meetings/m1/attendance", {
      studentId: "s2",
      present: false,
    });
    expect(unmarked.roster.find((r) => r.id === "s2")?.present).toBe(false);
  });
});
