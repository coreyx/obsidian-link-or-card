---
status: approved
---

# Reddit post titles from oEmbed

A pasted Reddit post gets the title "Reddit". `www.reddit.com` sends clients that aren't full browsers a bot-check page whose only title is "Reddit", and passing the check needs JavaScript, which Obsidian's request can't run. Reddit's public oEmbed API (`https://www.reddit.com/oembed?url=…`) isn't behind the check and returns the post's real title, the poster and the subreddit. This change asks it for Reddit post URLs and titles them `<post title> - r/<subreddit>`.

## User Review Required

> [!IMPORTANT]
> Pasting a Reddit post makes two requests to reddit.com instead of one: the page, as today, for the favicon, and the oEmbed lookup for the title and poster. Both run at the same time, under the same 10-second timeout. Nothing is sent anywhere but reddit.com, and URLs on the ignore list still aren't requested.

> [!NOTE]
> Reddit gives no description or thumbnail without passing the bot check, so a Reddit card shows the title, `u/<poster>` and the favicon, with no picture or summary.

> [!IMPORTANT]
> Share links (`/r/<sub>/s/<code>`, what Reddit's Share button copies) are looked up in two steps, one after the other: the page request, which Obsidian follows through the share link's redirect to the post, and then the oEmbed lookup for the post that page names. Each has its own 10-second timeout, so a share link can take up to twice as long as other links. Both requests go to reddit.com.

> [!IMPORTANT]
> The post behind a share link is read from the bot-check page Reddit sends, which names the post's path in the address of its form (`<form action="/r/<sub>/comments/<id>/<slug>…">`). That markup isn't documented and could change. If it does, share links go back to today's title, "Reddit"; nothing else breaks.

> [!NOTE]
> `redd.it/<id>` short links and bare `reddit.com/comments/<id>` links can't be looked up: their bot-check page names only `/comments/<id>`, with no subreddit, and oEmbed rejects that. They keep today's title.

## Open Questions

None at this time.

## Proposed Changes

### Reddit lookup

#### [NEW] `src/reddit.ts`
- [x] **TASK-1:** Add `parseRedditUrl(url)`, which recognises URLs on `reddit.com` and its subdomains (`www`, `old`, `new`, `np`, `m`), on http or https:
  - A post: `/r/<sub>/comments/<id>` with an optional slug and anything after it, such as a comment id. It returns the subreddit as written, the slug, and the oEmbed lookup URL. That URL is built from `https://www.reddit.com` plus the post's path, with the query and fragment dropped, so share-tracking parameters and `old.`/`m.` hosts don't matter.
  - A subreddit page: exactly `/r/<sub>` or `/r/<sub>/`.
  - Anything else, including share links, short links and user pages, returns null.
- [x] **TASK-2:** Add `redditTitle(page, url, request)`, which takes the result of the normal page fetch (or null) and returns the card data to use:
  - Post: request the oEmbed URL and parse its JSON. The title is `<title> - <r/Sub>`, taking the subreddit's capitalisation from the `reddit.com/r/<Sub>` link in the response's `html` and falling back to the URL's. The author is `u/<author_name>`. Favicon and any other fields come from the page fetch.
  - Post whose oEmbed lookup fails (an error status, non-JSON, no title, or a timeout): when the page gave no title or just "Reddit", guess the title from the slug, with underscores as spaces, as `<slug words> - r/<sub>`. With no slug, keep the page's result.
  - Subreddit page: the title is `r/<sub>` as written in the URL.
  - TSDoc explains the bot check and why oEmbed is used.

#### [MODIFY] `src/fetchMetadata.ts`
- [x] **TASK-3:** In `fetchMetadata`, when `parseRedditUrl` matches, run the page request and the oEmbed request together, each under the existing timeout, and pass both through `redditTitle`. Every other URL works as before. A Reddit fetch returns null only when both requests fail and there's no slug or subreddit to fall back on.

### Tests

#### [NEW] `tests/reddit.test.ts`
- [x] **TASK-4:** Cover, with made-up posts, usernames and subreddits only:
  - `parseRedditUrl` on post URLs on `www`, `old` and `m` hosts, an all-lowercase path, a share-tracking query, a comment permalink, and subreddit pages with and without the trailing slash. Short links, bare `/comments/<id>`, share links, user pages and other sites return null.
  - A successful oEmbed response gives `<title> - r/<Sub>` with the embed's capitalisation, `u/<name>` as the author, and the favicon from the page.
  - A failed lookup falls back to the slug guess, and keeps a real page title when the page has one. With no slug, it keeps the page's result.
  - A subreddit page is titled `r/<sub>`.
  - A non-Reddit URL makes one request, as before.

### Docs

#### [MODIFY] `README.md`
- [x] **TASK-5:** Add a short note that Reddit posts are titled `<post title> - r/<subreddit>` with the poster as the author, and which Reddit links can't be looked up.

#### [MODIFY] `CHANGELOG.md`
- [x] **TASK-6:** Add an `### Added` entry under `[Unreleased]` for Reddit post and subreddit titles.

### Share links

#### [MODIFY] `src/reddit.ts`
- [x] **TASK-7:** Recognize share links and read the post they lead to:
  - `parseRedditUrl` returns `{ kind: "share", subreddit }` for `/r/<sub>/s/<code>` (with or without a trailing slash) on the same hosts, instead of null.
  - Add `postInBotCheck(html)`, which returns the `RedditTarget` for the first form `action` in the page whose path is a post (`/r/<sub>/comments/<id>…`), parsed as if it were on www.reddit.com, or null when there is none.
  - `redditMetadata` handles a share link whose post wasn't found by returning the page's result unchanged.

#### [MODIFY] `src/fetchMetadata.ts`
- [x] **TASK-8:** For a share link, `fetchMetadata` requests the page as today, keeping its HTML, then looks for the post with `postInBotCheck`. When it finds one, it asks oEmbed about that post under its own timeout and builds the card with `redditMetadata` as for a pasted post, so a failed lookup falls back to the slug guess. The card keeps the share link as its `url`. When no post is found, or the page request fails, the result is what it is today.

#### [MODIFY] `tests/reddit.test.ts`
- [x] **TASK-9:** Cover, with made-up data only:
  - `parseRedditUrl` recognizes share links, with and without the trailing slash, and on `old.` hosts.
  - `postInBotCheck` finds the post in a synthetic bot-check page, ignores a form whose action isn't a post, and returns null for a page with no form.
  - A share link whose page names a post is titled `<title> - r/<Sub>` with `u/<poster>`, makes two requests in order, and keeps the share link as the card's `url`.
  - When the oEmbed lookup fails, a share link falls back to the slug guess from the page's form.
  - When the page names no post, or the page request fails, a share link keeps today's result and no oEmbed request is made.

#### [MODIFY] `README.md` and `CHANGELOG.md`
- [x] **TASK-10:** Update the Reddit notes in both: share links get the post's title, can take longer, and short links and bare `/comments/<id>` links still can't be looked up.

## Verification Plan

### Automated Tests
This repo uses vitest in `tests/` instead of a `scratch/` script.
1. The new cases in `tests/reddit.test.ts` pass.
2. The existing `fetchMetadata` and `metadata` tests still pass unchanged.
3. `npm run check` passes: typecheck, tests, plugin checks and the production build.

### Manual Verification
In a vault with this build installed, copy the URL of any Reddit post, then:
1. With **When pasting a URL** set to **Link**, paste it. It becomes `[<post title> - r/<subreddit>](<url>)`, with the title as shown on Reddit.
2. With **Card**, paste it again. The card shows the same title, `u/<poster>` under it, and the Reddit icon.
3. Paste the same post's URL with `old.reddit.com` as the host. It gets the same title.
4. Paste a subreddit URL such as `https://www.reddit.com/r/ObsidianMD/`. It becomes a link titled `r/ObsidianMD`.
5. Paste a `redd.it` short link. It gets today's title, which is usually "Reddit".
6. On a Reddit post, use **Share → Copy link** and paste the result, which looks like `https://www.reddit.com/r/<subreddit>/s/<code>`. With **Link**, it becomes `[<post title> - r/<subreddit>](<share link>)`; with **Card**, the card also shows `u/<poster>`.
