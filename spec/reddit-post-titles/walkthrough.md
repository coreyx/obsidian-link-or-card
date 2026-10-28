# Walkthrough: Reddit Post Titles

A pasted Reddit post is now titled `<post title> - r/<subreddit>`, as on the site, instead of "Reddit", and its card names the poster as `u/<name>`. The title comes from Reddit's oEmbed service, asked at the same time as the page, because the page itself is a bot check. A subreddit's front page is titled `r/<subreddit>`.

## What Was Implemented

### 1. Reddit lookup
- **`src/reddit.ts`, `parseRedditUrl()`** (3e1dd0b): Recognizes a post, `/r/<sub>/comments/<id>` with anything after it, on `reddit.com` and its `www`, `old`, `new`, `np` and `m` hosts. It returns the subreddit as written, the slug when there is one, and the oEmbed lookup URL. It also recognizes a subreddit's front page, with or without the trailing slash. Short links, bare `/comments/<id>` links, share links, user pages and other sites give null.
- **`src/reddit.ts`, `parseRedditOembed()` and `redditMetadata()`** (a8bd21b): `parseRedditOembed` reads the title, the poster and the subreddit's capitalization from oEmbed's JSON. `redditMetadata` combines that with the page fetch into the card data, including the slug guess when the lookup fails.
- **`src/fetchMetadata.ts`, `fetchMetadata()`** (5963c26): For a Reddit URL, the page request and the oEmbed request run together, each under the existing timeout. The page request moved into `fetchPage()`, unchanged, and every other URL goes through it as before.

**Changes from the plan.** The plan was checked against the sibling plugin's oEmbed implementation, which is finished and tested. These details changed, and what the plan promises didn't:
- **The lookup asks about the canonical post URL.** That's `https://www.reddit.com/r/<sub>/comments/<id>/`. The plan kept the pasted path, minus its query. The canonical form drops the slug and any comment id, and the sibling plugin uses it in its released version.
- **The subreddit's name comes from oEmbed's answer.** It falls back to the URL's. oEmbed names the post's real subreddit even when the URL names another, as well as its capitalization.
- **The title isn't HTML-decoded.** oEmbed sends it as plain text.
- **The plan's `redditTitle(page, url, request)` became two functions.** `parseRedditOembed` reads the answer and `redditMetadata` combines it with the page. The request itself stays in `fetchMetadata`, so it runs alongside the page request as TASK-3 asks.
- **Slug-less comment permalinks have no slug.** That's `/comments/<id>/comment/<comment id>/`, where the word "comment" would otherwise have been taken for the slug.

### 2. Tests
- **`tests/reddit.test.ts`** (922939b): 16 tests. They use only made-up posts, subreddits and usernames, and fake requesters, so nothing goes over the network.

### 3. Docs
- **`README.md`** (2934fa1): **Network use** describes the second request to reddit.com, the title and author format, and the links that can't be looked up.
- **`CHANGELOG.md`** (32910cc): an `Added` entry under `[Unreleased]`.

## Verification & Test Results

### Automated Tests
Ran `npx vitest run tests/reddit.test.ts`. Every check passed:
- **`parseRedditUrl` recognizes:** a post on all six hosts, a share-tracking query and fragment, a comment permalink, a lowercase path, a post without a slug, a slug-less comment permalink, and subreddit pages with and without the trailing slash. **Passed**
- **`parseRedditUrl` gives null for:** a short link, a bare `/comments/<id>` link, a share link, a user page, a subreddit's other pages, look-alike hosts and non-URLs. **Passed**
- **`parseRedditOembed`** refuses a body that isn't JSON or has no title, and leaves quotes and `&amp;` in the title alone. **Passed**
- **A successful lookup:**
  - Gives `<title> - r/ExampleSub`, with the embed's capitalization for a lowercase URL, `u/example_user` as the author, and the favicon from the page. **Passed**
  - Makes two requests, one of them to the canonical oEmbed URL. **Passed**
- **An embed with no subreddit link** falls back to the URL's subreddit. **Passed**
- **A failed page request** still gives the oEmbed title. **Passed**
- **A failed lookup falls back:**
  - It guesses from the slug when the page is the bot check. That covers no title, a 400, a thrown error and a timeout, and it works even when the page request failed as well. **Passed**
  - It keeps a real page title. **Passed**
  - With no slug, it keeps the page's result, or gives null when both requests failed. **Passed**
- **A subreddit page** is titled `r/ExampleSub` without asking oEmbed. **Passed**
- **A short link and a non-Reddit URL** each make one request, as before. **Passed**

**Mutation check.** Two small breaks were made in `src/reddit.ts`, one at a time:
- Preferring the URL's subreddit to oEmbed's failed 1 test.
- No longer treating a "Reddit" page title as missing failed 2.

A third break, removing the slug-less permalink rule, was planned. It wasn't run, because the command that would have applied it was malformed and left the file unchanged. The file was restored after each break, and `git status` showed it unchanged afterwards.

**Live check.** Not completed. I tried to confirm the canonical URL form against a live post, but Reddit answered the feed request with 429 (rate limited), so no post was looked up. I stopped rather than keep sending requests. Earlier in this work, oEmbed answered for lowercase paths, `old.reddit.com` URLs, share-tracking queries and comment permalinks. The sibling plugin sends the canonical form and passed its own manual tests in Obsidian. Manual steps 1 to 3 below confirm it for this plugin.

### Regression Testing
Ran `npm run check`: typecheck, all 119 tests in 10 files, plugin checks for 12 source files, and the production build. **Passed**

The existing `fetchMetadata` and `metadata` tests passed unchanged.

## Manual Verification
In a vault with this build installed, copy the URL of any Reddit post, then:
1. With **When pasting a URL** set to **Link**, paste it. It becomes `[<post title> - r/<subreddit>](<url>)`, with the title as shown on Reddit.
2. With **Card**, paste it again. The card shows the same title, `u/<poster>` under it, and the Reddit icon.
3. Paste the same post's URL with `old.reddit.com` as the host. It gets the same title.
4. Paste a subreddit URL such as `https://www.reddit.com/r/ObsidianMD/`. It becomes a link titled `r/ObsidianMD`.
5. Paste a `redd.it` short link. It gets today's title, which is usually "Reddit".

## Follow-ups
- **Deleted posts:** oEmbed titles a deleted post `[deleted by user]`, which this change would show as `[deleted by user] - r/<subreddit>`. The URL's slug still holds the original title words, so a deleted post could take the slug guess instead.
- **Links that can't be looked up:** short links, share links and user pages keep the title "Reddit", as the plan says. The sibling plugin treats a bare "Reddit" title on a Reddit host as no title instead, so its link falls back to the URL. This plugin could do the same, which would make a Link paste show the URL there instead of "Reddit".
- **Posts on user profiles:** `/user/<name>/comments/<id>` isn't recognized, so it keeps the page's title.
