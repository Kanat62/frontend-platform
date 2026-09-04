import { describe, expect, it } from "vitest";
import { daysLeft, formatDate, formatFull, relativeDay, weekdayShort, weekRangeOf } from "./date";

// TODAY (config) = 2026-08-18, вторник — фиксировано под референс (TЗ §15.6).

describe("daysLeft", () => {
  it("counts whole days between two dates", () => {
    expect(daysLeft("2026-08-20", "2026-08-18")).toBe(2);
    expect(daysLeft("2026-08-16", "2026-08-18")).toBe(-2);
    expect(daysLeft("2026-08-18", "2026-08-18")).toBe(0);
  });
});

describe("formatDate / formatFull", () => {
  it("formats a date in ru long and short form", () => {
    expect(formatDate("2026-08-18")).toBe("18 августа");
    expect(formatFull("2026-08-18")).toBe("18.08.2026");
  });
});

describe("relativeDay", () => {
  it("returns Сегодня/Завтра/Вчера near the anchor, else a formatted date", () => {
    expect(relativeDay("2026-08-18", "2026-08-18")).toBe("Сегодня");
    expect(relativeDay("2026-08-19", "2026-08-18")).toBe("Завтра");
    expect(relativeDay("2026-08-17", "2026-08-18")).toBe("Вчера");
    expect(relativeDay("2026-08-25", "2026-08-18")).toBe("25 августа");
  });
});

describe("weekdayShort", () => {
  it("returns Пн for a Monday", () => {
    expect(weekdayShort("2026-08-17")).toBe("Пн");
    expect(weekdayShort("2026-08-18")).toBe("Вт");
  });
});

describe("weekRangeOf", () => {
  it("returns the Mon..Sun range containing the anchor", () => {
    const week = weekRangeOf("2026-08-18");
    expect(week).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });
});
