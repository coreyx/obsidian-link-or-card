// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { decodeHtml, extractMetadata } from "../src/metadata";

const PAGE = "https://example.com/articles/1";

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;

describe("extractMetadata", () => {
  it("prefers Open Graph tags", () => {
    const html = page(`
      <title>Doc title</title>
      <meta name="description" content="Meta desc">
      <meta property="og:title" content="OG title">
      <meta name="twitter:title" content="Twitter title">
      <meta property="og:description" content="OG desc">
      <meta property="og:image" content="/og.png">
      <meta property="og:site_name" content="Example">
      <link rel="icon" href="/fav.png">
    `);
    expect(extractMetadata(html, PAGE)).toEqual({
      url: PAGE,
      title: "OG title",
      description: "OG desc",
      image: "https://example.com/og.png",
      favicon: "https://example.com/fav.png",
      site: "Example",
    });
  });

  it("falls back to Twitter tags, then <title> and the meta description", () => {
    const twitter = page(`<title>Doc</title><meta name="twitter:title" content="TW"><meta name="twitter:image" content="https://cdn.example.com/t.png">`);
    expect(extractMetadata(twitter, PAGE)).toMatchObject({ title: "TW", image: "https://cdn.example.com/t.png" });

    const plain = page(`<title> Doc  title </title><meta name="description" content="Meta desc">`);
    expect(extractMetadata(plain, PAGE)).toMatchObject({ title: "Doc title", description: "Meta desc" });
  });

  it("reads og tags written with name= and in any case", () => {
    const html = page(`<meta name="OG:Title" content="Named">`);
    expect(extractMetadata(html, PAGE).title).toBe("Named");
  });

  it("decodes entities", () => {
    const html = page(`<meta property="og:title" content="A &amp; B &#x3042;">`);
    expect(extractMetadata(html, PAGE).title).toBe("A & B あ");
  });

  it("resolves relative URLs against <base href>", () => {
    const html = page(`<base href="https://static.example.com/assets/"><meta property="og:image" content="og.png">`);
    expect(extractMetadata(html, PAGE).image).toBe("https://static.example.com/assets/og.png");
  });

  it("falls back to /favicon.ico at the page origin", () => {
    expect(extractMetadata(page(""), PAGE)).toEqual({ url: PAGE, favicon: "https://example.com/favicon.ico" });
  });

  it("prefers rel=icon over apple-touch-icon", () => {
    const html = page(`<link rel="apple-touch-icon" href="/apple.png"><link rel="shortcut icon" href="/short.ico">`);
    expect(extractMetadata(html, PAGE).favicon).toBe("https://example.com/short.ico");
  });

  it("drops images that are not http(s)", () => {
    const html = page(`<meta property="og:image" content="javascript:alert(1)"><link rel="icon" href="data:image/png;base64,AA">`);
    const meta = extractMetadata(html, PAGE);
    expect(meta.image).toBeUndefined();
    expect(meta.favicon).toBe("https://example.com/favicon.ico");
  });
});

const bytes = (...parts: (string | number[])[]): ArrayBuffer => {
  const chunks = parts.map((part) => (typeof part === "string" ? Array.from(new TextEncoder().encode(part)) : part));
  return new Uint8Array(chunks.flat()).buffer;
};

// 日本語 in Shift_JIS
const SJIS_NIHONGO = [0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea];

describe("decodeHtml", () => {
  it("uses the charset from the Content-Type header", () => {
    expect(decodeHtml(bytes(SJIS_NIHONGO), "text/html; charset=Shift_JIS")).toBe("日本語");
  });

  it("sniffs <meta charset> when the header has none", () => {
    const html = decodeHtml(bytes('<meta charset="shift_jis"><title>', SJIS_NIHONGO, "</title>"), "text/html");
    expect(html).toContain("<title>日本語</title>");
  });

  it("sniffs an http-equiv Content-Type", () => {
    const head = '<meta http-equiv="Content-Type" content="text/html; charset=EUC-JP">';
    // 日本語 in EUC-JP
    const html = decodeHtml(bytes(head, [0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec]), undefined);
    expect(html).toContain("日本語");
  });

  it("defaults to UTF-8 and survives unknown labels", () => {
    expect(decodeHtml(bytes("<p>日本語</p>"), undefined)).toBe("<p>日本語</p>");
    expect(decodeHtml(bytes("<p>日本語</p>"), "text/html; charset=x-made-up")).toBe("<p>日本語</p>");
  });
});
