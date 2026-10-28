import { describe, expect, it } from "vitest";
import { ALL_SPECIAL_SITES, DEFAULT_SETTINGS, resolveSettings, specialSites } from "../src/settingsData";

describe("resolveSettings", () => {
  it("returns the defaults when nothing was saved", () => {
    expect(resolveSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.pasteStyle).toBe("link");
  });

  it("keeps what was saved", () => {
    const saved = {
      pasteStyle: "ask",
      ignoredUrls: "example.com",
      preserveSelectionAsTitle: false,
      specialLinkHandling: false,
      specialLinkReddit: false,
      specialLinkYouTube: false,
    };
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

describe("special link handling", () => {
  it("is on for every site by default, including for data saved before it existed", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ specialLinkHandling: true, specialLinkReddit: true, specialLinkYouTube: true });
    const old = resolveSettings({ pasteStyle: "card", ignoredUrls: "", preserveSelectionAsTitle: true });
    expect(specialSites(old)).toEqual(ALL_SPECIAL_SITES);
  });

  it("follows each site's own switch", () => {
    expect(specialSites({ ...DEFAULT_SETTINGS, specialLinkReddit: false })).toEqual({ reddit: false, youtube: true });
    expect(specialSites({ ...DEFAULT_SETTINGS, specialLinkYouTube: false })).toEqual({ reddit: true, youtube: false });
  });

  it("is off for every site while the main switch is off, whatever the sites say", () => {
    expect(specialSites({ ...DEFAULT_SETTINGS, specialLinkHandling: false })).toEqual({ reddit: false, youtube: false });
  });
});
