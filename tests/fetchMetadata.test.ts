// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMetadata } from "../src/fetchMetadata";
import type { HttpResponse } from "../src/fetchMetadata";

const URL_ = "https://example.com/a";

const response = (body: string | number[], headers: Record<string, string>, status = 200): HttpResponse => ({
  status,
  headers,
  arrayBuffer: new Uint8Array(typeof body === "string" ? Array.from(new TextEncoder().encode(body)) : body).buffer,
});

const OG_PAGE = '<html><head><meta property="og:title" content="Hello"></head></html>';

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchMetadata", () => {
  it("requests the URL and extracts metadata from HTML", async () => {
    const request = vi.fn(async () => response(OG_PAGE, { "content-type": "text/html; charset=utf-8" }));
    const meta = await fetchMetadata(URL_, request);
    expect(request).toHaveBeenCalledWith(URL_);
    expect(meta).toMatchObject({ url: URL_, title: "Hello" });
  });

  it("reads the Content-Type header case-insensitively", async () => {
    const body = [...Array.from(new TextEncoder().encode("<title>")), 0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea];
    const meta = await fetchMetadata(URL_, async () => response(body, { "Content-Type": "text/html; charset=Shift_JIS" }));
    expect(meta?.title).toBe("日本語");
  });

  it("treats a response without Content-Type as HTML", async () => {
    const meta = await fetchMetadata(URL_, async () => response(OG_PAGE, {}));
    expect(meta?.title).toBe("Hello");
  });

  it("returns null for error statuses", async () => {
    expect(await fetchMetadata(URL_, async () => response(OG_PAGE, { "content-type": "text/html" }, 404))).toBeNull();
  });

  it("returns null for content that is not HTML", async () => {
    expect(await fetchMetadata(URL_, async () => response([0x89, 0x50], { "content-type": "image/png" }))).toBeNull();
  });

  it("returns null when the request fails", async () => {
    expect(await fetchMetadata(URL_, async () => Promise.reject(new Error("offline")))).toBeNull();
  });

  it("returns null when the request outlives the timeout", async () => {
    vi.useFakeTimers();
    const pending = fetchMetadata(URL_, () => new Promise<HttpResponse>(() => undefined), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toBeNull();
  });
});
