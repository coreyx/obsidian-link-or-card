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
