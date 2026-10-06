import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, resolveSettings } from "../src/settingsData";

describe("resolveSettings", () => {
  it("returns the defaults when nothing was saved", () => {
    expect(resolveSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.pasteStyle).toBe("link");
  });

  it("keeps what was saved", () => {
    const saved = { pasteStyle: "ask", ignoredUrls: "example.com", preserveSelectionAsTitle: false };
    expect(resolveSettings(saved)).toEqual(saved);
  });

  it("fills in settings added since the data was saved", () => {
    expect(resolveSettings({ ignoredUrls: "example.com" })).toEqual({ ...DEFAULT_SETTINGS, ignoredUrls: "example.com" });
  });

  it("reads the old toggle: off stays a plain paste, on moves to the default", () => {
    expect(resolveSettings({ askOnPaste: false }).pasteStyle).toBe("plain");
    expect(resolveSettings({ askOnPaste: true }).pasteStyle).toBe("link");
  });

  it("prefers the new setting over the old toggle, and drops the toggle", () => {
    const settings = resolveSettings({ askOnPaste: false, pasteStyle: "card" });
    expect(settings.pasteStyle).toBe("card");
    expect(settings).not.toHaveProperty("askOnPaste");
  });

  it("falls back to the default for a paste style it does not know", () => {
    expect(resolveSettings({ pasteStyle: "banner" }).pasteStyle).toBe("link");
  });
});
