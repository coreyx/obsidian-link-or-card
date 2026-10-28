import type { CardData } from "./cardBlock";

/**
 * A Reddit page that gets its title another way than from the page itself.
 * `www.reddit.com` answers clients that aren't full browsers with a JavaScript
 * bot check whose only title is "Reddit", and Obsidian's request can't run it.
 */
export type RedditTarget =
  | {
      kind: "post";
      /** The subreddit as written in the URL. */
      subreddit: string;
      /** The post's title slug from the URL, when it has one, such as `my_first_post`. */
      slug?: string;
      /** Reddit's oEmbed lookup for the post, which isn't behind the bot check. */
      oembedUrl: string;
    }
  | { kind: "subreddit"; subreddit: string };

/** Hosts that serve posts and subreddits at the same paths as www.reddit.com. */
const REDDIT_HOSTS = new Set(["reddit.com", "www.reddit.com", "old.reddit.com", "new.reddit.com", "np.reddit.com", "m.reddit.com"]);

/**
 * `/r/<sub>/comments/<id>`, then an optional slug and anything after it. The slug
 * is left out of `/comments/<id>/comment/<comment id>`, Reddit's slug-less comment
 * permalink, where the segment after the id is the word "comment", not a title.
 */
const POST_PATH = /^\/r\/(\w+)\/comments\/([a-z0-9]+)(?:\/(?!comment\/[^/])([^/]+))?(?:\/|$)/i;
const SUBREDDIT_PATH = /^\/r\/(\w+)\/?$/;

/** The slug as text, or undefined when it is missing or its percent-encoding is broken. */
function decodeSlug(slug: string | undefined): string | undefined {
  if (slug === undefined || slug === "") return undefined;
  try {
    return decodeURIComponent(slug);
  } catch {
    return undefined;
  }
}

/**
 * Recognizes a Reddit post or a subreddit's front page. For a post, the oEmbed
 * lookup asks about the canonical post URL: the slug, query, fragment and any
 * comment id are dropped, since oEmbed answers with the post's title for a comment
 * permalink too, and the host is always www so `old.` and `m.` links work alike.
 * Short links (`redd.it`), bare `/comments/<id>` links, app share links
 * (`/r/<sub>/s/<code>`) and user pages give null: oEmbed rejects the first two,
 * and the others name no post it can look up.
 */
export function parseRedditUrl(url: string): RedditTarget | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!REDDIT_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const post = POST_PATH.exec(parsed.pathname);
  if (post !== null) {
    const subreddit = post[1] ?? "";
    const postUrl = `https://www.reddit.com/r/${subreddit}/comments/${post[2] ?? ""}/`;
    const target: RedditTarget = {
      kind: "post",
      subreddit,
      oembedUrl: `https://www.reddit.com/oembed?url=${encodeURIComponent(postUrl)}`,
    };
    const slug = decodeSlug(post[3]);
    if (slug !== undefined) target.slug = slug;
    return target;
  }
  const subreddit = SUBREDDIT_PATH.exec(parsed.pathname);
  if (subreddit !== null) return { kind: "subreddit", subreddit: subreddit[1] ?? "" };
  return null;
}

/** What Reddit's oEmbed answer says about a post. */
export interface RedditEmbed {
  title: string;
  /** The poster's username, without `u/`. */
  author?: string;
  /** The subreddit with its own capitalization, from the embed's link to it. */
  subreddit?: string;
}

/**
 * Reads oEmbed's JSON answer. Its `title` is plain text, not HTML, so it is used
 * as it is apart from whitespace. The subreddit comes from the first
 * `reddit.com/r/<name>` link in the embed HTML: that carries the subreddit's own
 * capitalization, even for a lowercase URL, and names the post's real subreddit
 * when the URL named another. Null for anything that isn't JSON or has no title.
 */
export function parseRedditOembed(text: string): RedditEmbed | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { title, author_name: authorName, html } = data as Record<string, unknown>;
  if (typeof title !== "string") return null;
  const embed: RedditEmbed = { title: title.replace(/\s+/g, " ").trim() };
  if (embed.title === "") return null;
  if (typeof authorName === "string" && authorName.trim() !== "") embed.author = authorName.trim();
  const subreddit = typeof html === "string" ? /reddit\.com\/r\/(\w+)/i.exec(html)?.[1] : undefined;
  if (subreddit !== undefined) embed.subreddit = subreddit;
  return embed;
}

/** The bot check's page is titled just "Reddit", which says nothing about the post. */
const hasRealTitle = (page: CardData | null): boolean =>
  page?.title !== undefined && page.title.trim().toLowerCase() !== "reddit";

/**
 * The card data for a Reddit URL, from the normal page fetch (null if it failed)
 * and the oEmbed answer (null if there was none or it failed). The page supplies
 * the favicon and anything else it has; the bot check gives it nothing more.
 * - A post with an oEmbed answer is titled `<title> - r/<Subreddit>` and its
 *   author is `u/<poster>`.
 * - A post without one keeps a real page title. Failing that, its title is
 *   guessed from the URL's slug as `<slug words> - r/<sub>`, and with no slug the
 *   page's result stands.
 * - A subreddit page is titled `r/<sub>` as written in the URL.
 * Null only when there is neither a page nor anything to title it with.
 */
export function redditMetadata(url: string, target: RedditTarget, page: CardData | null, embed: RedditEmbed | null): CardData | null {
  const base: CardData = page ?? { url };
  if (target.kind === "subreddit") return { ...base, title: `r/${target.subreddit}` };
  if (embed !== null) {
    const data: CardData = { ...base, title: `${embed.title} - r/${embed.subreddit ?? target.subreddit}` };
    if (embed.author !== undefined) data.author = `u/${embed.author}`;
    return data;
  }
  if (hasRealTitle(page) || target.slug === undefined) return page;
  return { ...base, title: `${target.slug.replace(/_/g, " ").trim()} - r/${target.subreddit}` };
}
