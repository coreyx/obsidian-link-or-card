import { describe, expect, it } from "vitest";
import { formatMarkdownLink } from "../src/markdownLink";

describe("formatMarkdownLink", () => {
  it("builds [title](url)", () => {
    expect(formatMarkdownLink("Example Domain", "https://example.com")).toBe(
      "[Example Domain](https://example.com)",
    );
  });

  it("escapes brackets and backslashes in the title", () => {
    expect(formatMarkdownLink("[PR] a\\b ]", "https://example.com")).toBe(
      "[\\[PR\\] a\\\\b \\]](https://example.com)",
    );
  });

  it("collapses whitespace and newlines in the title", () => {
    expect(formatMarkdownLink("  Hello\n\n  world  ", "https://example.com")).toBe(
      "[Hello world](https://example.com)",
    );
  });

  it("percent-encodes parentheses and spaces in the URL so the link does not break", () => {
    expect(formatMarkdownLink("Paren", "https://en.wikipedia.org/wiki/Foo_(bar)")).toBe(
      "[Paren](https://en.wikipedia.org/wiki/Foo_%28bar%29)",
    );
  });
});
