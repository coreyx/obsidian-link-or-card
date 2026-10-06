import { describe, expect, it } from "vitest";
import { isIgnoredUrl, parsePastedUrl, safeHttpUrl } from "../src/url";

describe("parsePastedUrl", () => {
  it("accepts a single http or https URL", () => {
    expect(parsePastedUrl("https://example.com/a?b=1#c")).toBe("https://example.com/a?b=1#c");
    expect(parsePastedUrl("http://example.com")).toBe("http://example.com");
  });

  it("trims surrounding whitespace and newlines", () => {
    expect(parsePastedUrl("  https://example.com/a \n")).toBe("https://example.com/a");
  });

  it("rejects text that is not only a URL", () => {
    expect(parsePastedUrl("see https://example.com")).toBeNull();
    expect(parsePastedUrl("https://example.com and more")).toBeNull();
    expect(parsePastedUrl("https://a.com\nhttps://b.com")).toBeNull();
    expect(parsePastedUrl("")).toBeNull();
  });

  it("rejects other schemes and malformed URLs", () => {
    expect(parsePastedUrl("ftp://example.com")).toBeNull();
    expect(parsePastedUrl("javascript:alert(1)")).toBeNull();
    expect(parsePastedUrl("obsidian://open?vault=x")).toBeNull();
    expect(parsePastedUrl("https://")).toBeNull();
    expect(parsePastedUrl("example.com")).toBeNull();
  });
});

describe("isIgnoredUrl", () => {
  it("ignores nothing when the list is empty or blank", () => {
    expect(isIgnoredUrl("https://example.com/a", "")).toBe(false);
    expect(isIgnoredUrl("https://example.com/a", " \n\n  ")).toBe(false);
  });

  it("matches a domain and its subdomains, whatever the scheme", () => {
    expect(isIgnoredUrl("https://example.com/a?b=1", "example.com")).toBe(true);
    expect(isIgnoredUrl("http://docs.example.com/", "example.com")).toBe(true);
    expect(isIgnoredUrl("https://EXAMPLE.com", "Example.COM")).toBe(true);
    expect(isIgnoredUrl("https://notexample.com", "example.com")).toBe(false);
    expect(isIgnoredUrl("https://example.com.evil.test", "example.com")).toBe(false);
    expect(isIgnoredUrl("https://example.com", "docs.example.com")).toBe(false);
  });

  it("accepts entries written with a scheme, a wildcard or a trailing slash", () => {
    expect(isIgnoredUrl("http://example.com/a", "https://example.com/")).toBe(true);
    expect(isIgnoredUrl("https://docs.example.com", "*.example.com")).toBe(true);
    expect(isIgnoredUrl("https://docs.example.com", "https://*.example.com")).toBe(true);
  });

  it("narrows an entry to a path by whole segments", () => {
    expect(isIgnoredUrl("https://github.com/my-org", "github.com/my-org")).toBe(true);
    expect(isIgnoredUrl("https://github.com/my-org/repo?tab=readme#top", "github.com/my-org/")).toBe(true);
    expect(isIgnoredUrl("https://github.com/my-organization", "github.com/my-org")).toBe(false);
    expect(isIgnoredUrl("https://github.com/other", "github.com/my-org")).toBe(false);
  });

  it("narrows an entry to a port when one is given", () => {
    expect(isIgnoredUrl("http://localhost:3000/a", "localhost:3000")).toBe(true);
    expect(isIgnoredUrl("http://localhost:8080/a", "localhost:3000")).toBe(false);
    expect(isIgnoredUrl("http://localhost:8080/a", "localhost")).toBe(true);
  });

  it("checks every line and skips the ones it cannot read", () => {
    const list = "example.com\r\n  \nhttps://\n???\n  github.com/my-org  ";
    expect(isIgnoredUrl("https://github.com/my-org/repo", list)).toBe(true);
    expect(isIgnoredUrl("https://example.com", list)).toBe(true);
    expect(isIgnoredUrl("https://obsidian.md", list)).toBe(false);
  });
});

describe("safeHttpUrl", () => {
  it("returns the URL for http and https", () => {
    expect(safeHttpUrl("https://example.com/x.png")).toBe("https://example.com/x.png");
  });

  it("returns null for anything else", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });
});
