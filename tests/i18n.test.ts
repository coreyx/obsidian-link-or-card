import { describe, expect, it } from "vitest";
import { getStrings } from "../src/i18n";

describe("getStrings", () => {
  it("returns Japanese for ja locales and English otherwise", () => {
    expect(getStrings("ja").menuCard).toBe("カード");
    expect(getStrings("ja-JP").menuCard).toBe("カード");
    expect(getStrings("en").menuCard).toBe("Card");
    expect(getStrings("fr").menuCard).toBe("Card");
  });

  it("has every string filled in both languages", () => {
    const en = getStrings("en");
    const ja = getStrings("ja");
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
    for (const value of [...Object.values(en), ...Object.values(ja)]) expect(value.trim()).not.toBe("");
  });
});
