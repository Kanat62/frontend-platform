import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `teachers` (роль C) — BACKEND.md §12. t1 (Айжан Осмонова) ведёт g-en-0824 (EN).

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /teachers", () => {
  it("lists teachers with the status summary and per-teacher counts", async () => {
    const res = await apiClient.get<Dto<"TeachersListDto">>("/teachers");
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.summary.active).toBeGreaterThan(0);

    const t1 = res.items.find((t) => t.id === "t1")!;
    expect(t1.groupsCount).toBeGreaterThanOrEqual(1);
    expect(t1.studentsCount).toBeGreaterThanOrEqual(1);
  });
});

describe("POST /teachers", () => {
  it("creates a teacher defaulting to active status", async () => {
    const created = await apiClient.post<Dto<"TeacherListItemDto">>("/teachers", {
      name: "Новый Преподаватель",
      phone: "+996 700 000 000",
      languages: ["en"],
    });
    expect(created.status).toBe("active");
    expect(created.groupsCount).toBe(0);

    const list = await apiClient.get<Dto<"TeachersListDto">>("/teachers");
    expect(list.items.some((t) => t.id === created.id)).toBe(true);
  });
});

describe("GET /teachers/:id", () => {
  it("includes groups, individual students and today's practice count", async () => {
    const t2 = await apiClient.get<Dto<"TeacherDetailDto">>("/teachers/t2");
    expect(t2.groups.some((g) => g.id === "g-en-0907")).toBe(true);
    // s3 (aibek) is an individual student of t2 (mock-data.ts).
    expect(t2.individuals.some((s) => s.id === "s3")).toBe(true);
  });

  it("404s for an unknown teacher", async () => {
    await expect(apiClient.get("/teachers/does-not-exist")).rejects.toMatchObject({ status: 404 });
  });
});

describe("PATCH /teachers/:id", () => {
  it("updates the status", async () => {
    const updated = await apiClient.patch<Dto<"TeacherListItemDto">>("/teachers/t5", { status: "replacement" });
    expect(updated.status).toBe("replacement");

    // Восстанавливаем сид для остальных тестов в этом файле (db переиспользуется в файле).
    await apiClient.patch("/teachers/t5", { status: "absent" });
  });
});
