import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `students`/`notes` (роль C) — BACKEND.md §12. kanat (s1, group g-en-0824,
// teacher t1) и alina (s2, тоже g-en-0824) — сид-фикстуры для группы.

async function loginAs(login: string, password = "test123") {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", { login, password });
  setAccessToken(accessToken);
}

beforeAll(() => loginAs("curator"));

describe("GET /students", () => {
  it("paginates and reports the total independent of the page size", async () => {
    const page1 = await apiClient.get<Dto<"StudentsListDto">>("/students?page=1");
    expect(page1.items).toHaveLength(20);
    expect(page1.total).toBeGreaterThan(20);
    expect(page1.page).toBe(1);
  });

  it("filters by query text across name/login/phone", async () => {
    const res = await apiClient.get<Dto<"StudentsListDto">>("/students?q=kanat");
    expect(res.items.map((s) => s.login)).toEqual(["kanat"]);
  });

  it("filters by group and reports the embedded product/group code", async () => {
    const res = await apiClient.get<Dto<"StudentsListDto">>("/students?groupId=g-en-0824");
    const kanat = res.items.find((s) => s.login === "kanat")!;
    expect(kanat.groupCode).toBe("EN-02"); // g-en-0518 (earlier startDate) took EN-01
    expect(kanat.productTitle).toContain("English");
    expect(kanat.currentLessonOrder).toBe(3); // completed [1,2] -> next incomplete opened lesson
  });

  it("403s a student token (role gate, not just auth)", async () => {
    await loginAs("kanat");
    await expect(apiClient.get("/students")).rejects.toMatchObject({ status: 403 });
    await loginAs("curator");
  });
});

describe("POST /students", () => {
  it("creates a student, rejects a taken login, and returns the one-time password", async () => {
    await expect(
      apiClient.post("/students", {
        firstName: "Тест",
        lastName: "Тестов",
        age: null,
        city: "",
        phone: "",
        login: "kanat", // уже занят
        password: "abcde",
        language: "en",
        type: "INDIVIDUAL",
        startDate: "2026-09-10",
        practiceStart: "20:00",
        groupId: null,
        manager: "",
        total: null,
        paid: null,
      }),
    ).rejects.toMatchObject({ status: 400 });

    const created = await apiClient.post<Dto<"CreateStudentResponseDto">>("/students", {
      firstName: "Тест",
      lastName: "Тестов",
      age: null,
      city: "",
      phone: "",
      login: "test-e2e-student",
      password: "swxyz",
      language: "en",
      type: "INDIVIDUAL",
      startDate: "2026-09-10",
      practiceStart: "20:00",
      groupId: null,
      manager: "",
      total: null,
      paid: null,
    });
    expect(created.login).toBe("test-e2e-student");
    // Пароль с формы возвращается как есть (сервер только хеширует).
    expect(created.password).toBe("swxyz");
    // Поля для приветственного сообщения куратора (экран «Ученик создан»).
    expect(created.phone).toBe("");
    expect(created.language).toBe("en");
    expect(created.durationMonths).toBe(1); // INDIVIDUAL — 1 месяц

    const header = await apiClient.get<Dto<"StudentHeaderDto">>(`/students/${created.id}`);
    expect(header.firstName).toBe("Тест");
  });
});

describe("student card tabs", () => {
  it("GET /students/:id/overview reports the group and teacher", async () => {
    const overview = await apiClient.get<Dto<"StudentOverviewDto">>("/students/s1/overview");
    expect(overview.group?.name).toContain("EN-02");
    expect(overview.teacherName).toBeTruthy();
    expect(overview.groupRequired).toBe(true);
  });

  it("GET /students/:id/learning lists all 54 lessons with computed state", async () => {
    const learning = await apiClient.get<Dto<"StudentLearningDto">>("/students/s1/learning");
    expect(learning.lessons).toHaveLength(54);
    expect(learning.lessons.find((l) => l.order === 1)?.state).toBe("completed");
    expect(learning.lessons.find((l) => l.order === 5)?.state).toBe("locked");
  });

  it("GET /students/:id/practice and /progress return consistent stats", async () => {
    const practice = await apiClient.get<Dto<"StudentPracticeDto">>("/students/s1/practice");
    const progress = await apiClient.get<Dto<"StudentProgressDto">>("/students/s1/progress");
    expect(practice.attended).toBe(progress.practiceAttended);
    expect(practice.total).toBe(progress.practiceTotal);
  });
});

describe("PATCH /students/:id/group — assignStudentToGroup side effects", () => {
  it("moving a student into a group pulls its teacher and dates", async () => {
    // s4 (nurai): EN/GROUP in the finished g-en-0518 -> move into the active g-en-0824.
    const header = await apiClient.patch<Dto<"StudentHeaderDto">>("/students/s4/group", {
      groupId: "g-en-0824",
    });
    expect(header.id).toBe("s4");

    const overview = await apiClient.get<Dto<"StudentOverviewDto">>("/students/s4/overview");
    expect(overview.group?.name).toContain("EN-02");
    expect(overview.teacherName).toBeTruthy(); // g-en-0824's teacher (t1) — derived from the group.
    expect(overview.startDate).toBe("2026-08-18"); // g-en-0824's own startDate, not nurai's old one.
  });
});

describe("POST /students/bulk", () => {
  it("bulk-assigns a group and derives the teacher from it (not the client)", async () => {
    await apiClient.post("/students/bulk", {
      ids: ["s2"],
      patch: { groupId: "g-en-0907" },
    });
    const overview = await apiClient.get<Dto<"StudentOverviewDto">>("/students/s2/overview");
    expect(overview.group?.name).toContain("EN-03");
    // g-en-0907's teacher is t2 (seed) — derived server-side, not passed by the client.
    expect(overview.teacherName).toBeTruthy();
  });
});

describe("notes", () => {
  it("adds and deletes a note, author comes from the curator session (not the client)", async () => {
    const list0 = await apiClient.get<Dto<"NoteDto">[]>("/students/s1/notes");
    const before = list0.length;

    const created = await apiClient.post<Dto<"NoteDto">>("/students/s1/notes", { content: "  тестовая заметка  " });
    expect(created.content).toBe("тестовая заметка");
    expect(created.author).toBeTruthy();

    const list1 = await apiClient.get<Dto<"NoteDto">[]>("/students/s1/notes");
    expect(list1).toHaveLength(before + 1);

    await apiClient.delete(`/notes/${created.id}`);
    const list2 = await apiClient.get<Dto<"NoteDto">[]>("/students/s1/notes");
    expect(list2).toHaveLength(before);
  });

  it("rejects an empty note", async () => {
    await expect(apiClient.post("/students/s1/notes", { content: "   " })).rejects.toMatchObject({ status: 400 });
  });
});
