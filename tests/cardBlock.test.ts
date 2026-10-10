import { describe, expect, it } from "vitest";
import { CARD_LANGUAGE, formatCardBlock, parseCardBlock } from "../src/cardBlock";

describe("formatCardBlock", () => {
  it("writes a fenced block with one key per line, skipping empty fields", () => {
    const block = formatCardBlock({
      url: "https://example.com/a",
      title: "Title",
      description: "",
      image: "https://example.com/og.png",
    });
    expect(block).toBe(
      ["```" + CARD_LANGUAGE, "url: https://example.com/a", "title: Title", "image: https://example.com/og.png", "```"].join("\n"),
    );
  });

  it("writes the author right after the title", () => {
    const block = formatCardBlock({ url: "https://example.com", description: "Desc", author: "Jane Doe", title: "Title" });
    expect(block.split("\n").slice(1, -1)).toEqual(["url: https://example.com", "title: Title", "author: Jane Doe", "description: Desc"]);
  });

  it("keeps every value on one line", () => {
    const block = formatCardBlock({ url: "https://example.com", description: "line one\n\n line two\t end" });
    expect(block).toContain("description: line one line two end");
  });

  it("cannot be closed early by a value that contains a fence", () => {
    const block = formatCardBlock({ url: "https://example.com", title: "a ``` b" });
    const lines = block.split("\n");
    expect(lines.filter((line) => line.startsWith("```"))).toHaveLength(2);
  });
});

describe("parseCardBlock", () => {
  it("round-trips what formatCardBlock wrote", () => {
    const data = {
      url: "https://example.com/a?x=1",
      title: "Title: with colon",
      author: "Jane Doe",
      description: "Desc",
      image: "https://example.com/og.png",
      favicon: "https://example.com/favicon.ico",
      site: "Example",
    };
    const block = formatCardBlock(data);
    const body = block.split("\n").slice(1, -1).join("\n");
    expect(parseCardBlock(body)).toEqual(data);
  });

  it("ignores unknown keys, blank lines and surrounding quotes", () => {
    expect(parseCardBlock('\nurl: "https://example.com"\nfoo: bar\n\ntitle: \'T\'\n')).toEqual({
      url: "https://example.com",
      title: "T",
    });
  });

  it("returns null when url is missing", () => {
    expect(parseCardBlock("title: no url")).toBeNull();
  });
});
