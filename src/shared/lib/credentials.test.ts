import { describe, expect, it } from "vitest";
import { generateLogin, generatePassword, transliterate } from "./credentials";

describe("transliterate", () => {
  it("converts cyrillic to latin letters/digits only", () => {
    expect(transliterate("Канат")).toBe("kanat");
    expect(transliterate("Алина Ким-2")).toBe("alinakim2");
  });
});

describe("generateLogin", () => {
  it("builds <name><last two phone digits> when free", () => {
    expect(generateLogin("Канат", "+996 700 112 233", new Set())).toBe("kanat33");
  });

  it("falls back to random digits when the natural login is taken", () => {
    const taken = new Set(["kanat33"]);
    const login = generateLogin("Канат", "+996 700 112 233", taken);
    expect(login).toMatch(/^kanat\d{2}$/);
    expect(login).not.toBe("kanat33");
  });
});

describe("generatePassword", () => {
  it("generates a 5-letter lowercase password unique to the taken set", () => {
    const pw = generatePassword(new Set());
    expect(pw).toMatch(/^[a-z]{5}$/);
  });
});
