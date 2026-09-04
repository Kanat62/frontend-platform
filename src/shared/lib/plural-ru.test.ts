import { describe, expect, it } from "vitest";
import { pluralRu } from "./plural-ru";

describe("pluralRu", () => {
  it("picks 'one' for numbers ending in 1 (except 11)", () => {
    expect(pluralRu(1, "день", "дня", "дней")).toBe("день");
    expect(pluralRu(21, "день", "дня", "дней")).toBe("день");
    expect(pluralRu(11, "день", "дня", "дней")).toBe("дней");
  });

  it("picks 'few' for 2-4 (except 12-14)", () => {
    expect(pluralRu(2, "день", "дня", "дней")).toBe("дня");
    expect(pluralRu(3, "день", "дня", "дней")).toBe("дня");
    expect(pluralRu(4, "день", "дня", "дней")).toBe("дня");
    expect(pluralRu(24, "день", "дня", "дней")).toBe("дня");
    expect(pluralRu(14, "день", "дня", "дней")).toBe("дней");
  });

  it("picks 'many' for 0, 5-20", () => {
    expect(pluralRu(0, "день", "дня", "дней")).toBe("дней");
    expect(pluralRu(5, "день", "дня", "дней")).toBe("дней");
    expect(pluralRu(20, "день", "дня", "дней")).toBe("дней");
  });
});
