// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fetchMetadata } from "../src/fetchMetadata";
import type { HttpResponse } from "../src/fetchMetadata";
import { parseRedditOembed, parseRedditUrl } from "../src/reddit";

// Every post, subreddit and username here is made up.
const POST = "https://www.reddit.com/r/ExampleSub/comments/abc123/my_first_post/";
const OEMBED = "https://www.reddit.com/oembed?url=" + encodeURIComponent("https://www.reddit.com/r/ExampleSub/comments/abc123/");

const response = (body: string, headers: Record<string, string>, status = 200): HttpResponse => ({
  status,
  headers,
  arrayBuffer: new Uint8Array(Array.from(new TextEncoder().encode(body))).buffer,
});

/** What www.reddit.com sends a client that can't pass its bot check. */
const BOT_CHECK = response('<html><head><title>Reddit</title><link rel="icon" href="/icon-example.png"></head></html>', {
  "content-type": "text/html; charset=utf-8",
});

const embed = (fields: Record<string, unknown>): HttpResponse => response(JSON.stringify(fields), { "content-type": "application/json" });

const EMBED = embed({
  type: "rich",
  title: "My first  post",
  author_name: "example_user",
  provider_name: "reddit",
  html: '<blockquote><a href="https://www.reddit.com/r/ExampleSub/comments/abc123/my_first_post/">My first post</a> by <a href="https://www.reddit.com/user/example_user/">u/example_user</a></blockquote>',
});

/** A requester that answers the oEmbed lookup and the page with the given responses. */
const reddit = (oembed: HttpResponse | Error, page: HttpResponse | Error = BOT_CHECK) =>
  vi.fn(async (url: string) => {
    const answer = url.startsWith("https://www.reddit.com/oembed?") ? oembed : page;
    if (answer instanceof Error) throw answer;
    return answer;
  });

describe("parseRedditUrl", () => {
  it("recognizes a post on any Reddit host and asks oEmbed about the canonical post URL", () => {
    for (const host of ["www.reddit.com", "reddit.com", "old.reddit.com", "m.reddit.com", "new.reddit.com", "np.reddit.com"]) {
      expect(parseRedditUrl(`https://${host}/r/ExampleSub/comments/abc123/my_first_post/`)).toEqual({
        kind: "post",
        subreddit: "ExampleSub",
        slug: "my_first_post",
        oembedUrl: OEMBED,
      });
    }
  });

  it("drops the query, fragment and comment id, and keeps the path's own casing", () => {
    expect(parseRedditUrl(`${POST}?utm_source=share&utm_medium=web#top`)).toEqual(parseRedditUrl(POST));
    expect(parseRedditUrl(`${POST}def456/?context=3`)).toEqual(parseRedditUrl(POST));
    expect(parseRedditUrl("https://www.reddit.com/r/examplesub/comments/abc123/my_first_post")).toMatchObject({
      subreddit: "examplesub",
      oembedUrl: "https://www.reddit.com/oembed?url=" + encodeURIComponent("https://www.reddit.com/r/examplesub/comments/abc123/"),
    });
  });

  it("finds no slug in a post URL without one, or in a slug-less comment permalink", () => {
    const noSlug = { kind: "post", subreddit: "ExampleSub", oembedUrl: OEMBED };
    expect(parseRedditUrl("https://www.reddit.com/r/ExampleSub/comments/abc123/")).toEqual(noSlug);
    expect(parseRedditUrl("https://www.reddit.com/r/ExampleSub/comments/abc123/comment/def456/")).toEqual(noSlug);
  });

  it("recognizes a subreddit's front page, with or without the trailing slash", () => {
    expect(parseRedditUrl("https://www.reddit.com/r/ExampleSub/")).toEqual({ kind: "subreddit", subreddit: "ExampleSub" });
    expect(parseRedditUrl("https://old.reddit.com/r/ExampleSub")).toEqual({ kind: "subreddit", subreddit: "ExampleSub" });
  });

  it("returns null for links oEmbed can't look up and for other sites", () => {
    expect(parseRedditUrl("https://redd.it/abc123")).toBeNull();
    expect(parseRedditUrl("https://www.reddit.com/comments/abc123/")).toBeNull();
    expect(parseRedditUrl("https://www.reddit.com/user/example_user/")).toBeNull();
    expect(parseRedditUrl("https://www.reddit.com/r/ExampleSub/top/")).toBeNull();
    expect(parseRedditUrl("https://reddit.example.com/r/ExampleSub/comments/abc123/")).toBeNull();
    expect(parseRedditUrl("https://example.com/r/ExampleSub/comments/abc123/")).toBeNull();
    expect(parseRedditUrl("not a url")).toBeNull();
  });
});

describe("parseRedditOembed", () => {
  it("returns null for a body that isn't JSON or has no title", () => {
    expect(parseRedditOembed("<html>Not found</html>")).toBeNull();
    expect(parseRedditOembed("null")).toBeNull();
    expect(parseRedditOembed(JSON.stringify({ author_name: "example_user" }))).toBeNull();
    expect(parseRedditOembed(JSON.stringify({ title: "  " }))).toBeNull();
  });

  it("leaves the title's characters alone, since oEmbed sends it as plain text", () => {
    const title = "It's a \"quoted\" &amp; post";
    expect(parseRedditOembed(JSON.stringify({ title }))).toEqual({ title });
  });
});

describe("fetchMetadata for Reddit", () => {
  it("titles a post from oEmbed, with the embed's casing, the poster as author and the page's favicon", async () => {
    const request = reddit(EMBED);
    const meta = await fetchMetadata("https://old.reddit.com/r/examplesub/comments/abc123/my_first_post/?utm_source=share", request);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledWith("https://www.reddit.com/oembed?url=" + encodeURIComponent("https://www.reddit.com/r/examplesub/comments/abc123/"));
    expect(meta).toMatchObject({ title: "My first post - r/ExampleSub", author: "u/example_user", favicon: "https://old.reddit.com/icon-example.png" });
  });

  it("falls back to the URL's subreddit when the embed links none", async () => {
    const meta = await fetchMetadata(POST, reddit(embed({ title: "My first post" })));
    expect(meta?.title).toBe("My first post - r/ExampleSub");
    expect(meta?.author).toBeUndefined();
  });

  it("still titles the post when the page request fails", async () => {
    const meta = await fetchMetadata(POST, reddit(EMBED, new Error("offline")));
    expect(meta).toEqual({ url: POST, title: "My first post - r/ExampleSub", author: "u/example_user" });
  });

  it("guesses the title from the slug when the lookup fails and the page is the bot check", async () => {
    for (const failure of [embed({}), response("Bad Request", {}, 400), new Error("offline")]) {
      const meta = await fetchMetadata(POST, reddit(failure));
      expect(meta).toMatchObject({ title: "my first post - r/ExampleSub", favicon: "https://www.reddit.com/icon-example.png" });
    }
    const neither = await fetchMetadata(POST, reddit(new Error("offline"), new Error("offline")));
    expect(neither).toEqual({ url: POST, title: "my first post - r/ExampleSub" });
  });

  it("guesses from the slug when the lookup times out", async () => {
    vi.useFakeTimers();
    try {
      const request = vi.fn((url: string) => (url.includes("/oembed?") ? new Promise<HttpResponse>(() => undefined) : Promise.resolve(BOT_CHECK)));
      const pending = fetchMetadata(POST, request, 1000);
      await vi.advanceTimersByTimeAsync(1000);
      expect((await pending)?.title).toBe("my first post - r/ExampleSub");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a real page title when the lookup fails", async () => {
    const page = response("<title>A real title</title>", { "content-type": "text/html" });
    expect((await fetchMetadata(POST, reddit(new Error("offline"), page)))?.title).toBe("A real title");
  });

  it("keeps the page's result for a post with no slug when the lookup fails", async () => {
    const url = "https://www.reddit.com/r/ExampleSub/comments/abc123/";
    expect((await fetchMetadata(url, reddit(new Error("offline"))))?.title).toBe("Reddit");
    expect(await fetchMetadata(url, reddit(new Error("offline"), new Error("offline")))).toBeNull();
  });

  it("titles a subreddit page r/<sub> without asking oEmbed", async () => {
    const request = reddit(EMBED);
    const meta = await fetchMetadata("https://www.reddit.com/r/ExampleSub/", request);
    expect(meta?.title).toBe("r/ExampleSub");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("https://www.reddit.com/r/ExampleSub/");
  });

  it("makes one request for a Reddit link it can't look up, and for other sites", async () => {
    for (const url of ["https://redd.it/abc123", "https://example.com/r/ExampleSub/comments/abc123/my_first_post/"]) {
      const request = reddit(EMBED);
      expect((await fetchMetadata(url, request))?.title).toBe("Reddit");
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith(url);
    }
  });
});
