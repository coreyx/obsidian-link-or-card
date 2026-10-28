import type { CardData } from "./cardBlock";
import { decodeHtml, extractMetadata } from "./metadata";
import { parseRedditOembed, parseRedditUrl, postInBotCheck, redditMetadata } from "./reddit";
import type { RedditEmbed } from "./reddit";

/** The slice of Obsidian's RequestUrlResponse this module needs, so tests can stub it. */
export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
}

export type Requester = (url: string) => Promise<HttpResponse>;

export const DEFAULT_TIMEOUT_MS = 10_000;

const header = (headers: Record<string, string>, name: string): string | undefined => {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
};

/**
 * requestUrl has no timeout option, and a hung request would leave the paste
 * unresolved forever. Timers come from `window` so they also run in popout windows.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** The page's HTML, or null on any failure or when the response isn't HTML. */
async function fetchHtml(url: string, request: Requester, timeoutMs: number): Promise<string | null> {
  try {
    const response = await withTimeout(request(url), timeoutMs);
    if (response.status < 200 || response.status >= 300) return null;
    const contentType = header(response.headers, "content-type");
    if (contentType !== undefined && !/html/i.test(contentType)) return null;
    return decodeHtml(response.arrayBuffer, contentType);
  } catch {
    return null;
  }
}

/** The page's metadata, or null on any failure. */
async function fetchPage(url: string, request: Requester, timeoutMs: number): Promise<CardData | null> {
  const html = await fetchHtml(url, request, timeoutMs);
  return html === null ? null : extractMetadata(html, url);
}

/** Reddit's oEmbed answer for a post, or null on any failure. */
async function fetchRedditEmbed(oembedUrl: string, request: Requester, timeoutMs: number): Promise<RedditEmbed | null> {
  try {
    const response = await withTimeout(request(oembedUrl), timeoutMs);
    if (response.status < 200 || response.status >= 300) return null;
    // JSON is always UTF-8, so the HTML charset handling doesn't apply.
    return parseRedditOembed(new TextDecoder("utf-8").decode(response.arrayBuffer));
  } catch {
    return null;
  }
}

/**
 * A share link's card. Obsidian follows the link's redirect to the post, where the
 * bot check names it (see {@link postInBotCheck}), so only then can oEmbed be
 * asked about the post, and the two requests can't overlap. The card keeps the
 * share link as its URL.
 */
async function fetchRedditShare(url: string, request: Requester, timeoutMs: number): Promise<CardData | null> {
  const html = await fetchHtml(url, request, timeoutMs);
  if (html === null) return null;
  const page = extractMetadata(html, url);
  const post = postInBotCheck(html);
  if (post === null) return page;
  return redditMetadata(url, post, page, await fetchRedditEmbed(post.oembedUrl, request, timeoutMs));
}

/**
 * Resolves to null on any failure; the caller decides how to degrade. A Reddit
 * post or subreddit URL also gets its title from Reddit itself (see
 * {@link redditMetadata}), with the oEmbed lookup run alongside the page request
 * so the paste waits no longer than before. A share link's lookup has to follow
 * its page request instead, so it can take up to twice as long.
 */
export async function fetchMetadata(
  url: string,
  request: Requester,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CardData | null> {
  const reddit = parseRedditUrl(url);
  if (reddit === null) return fetchPage(url, request, timeoutMs);
  if (reddit.kind === "share") return fetchRedditShare(url, request, timeoutMs);
  const [page, embed] = await Promise.all([
    fetchPage(url, request, timeoutMs),
    reddit.kind === "post" ? fetchRedditEmbed(reddit.oembedUrl, request, timeoutMs) : Promise.resolve(null),
  ]);
  return redditMetadata(url, reddit, page, embed);
}
