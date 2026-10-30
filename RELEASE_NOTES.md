# Release notes

## 0.8.0

### Reddit links get their real titles

A pasted Reddit post used to be titled just "Reddit", because Reddit shows requests that aren't from a browser a bot check instead of the page. It now gets the title you see on the site:

| Pasted link | Title | Author on a card |
| --- | --- | --- |
| A post, including `old.` and `m.` links and links to a comment | `<post title> - r/<subreddit>` | `u/<poster>` |
| A share link from Reddit's **Share** button (`/r/<subreddit>/s/…`) | `<post title> - r/<subreddit>` | `u/<poster>` |
| A subreddit's front page | `r/<subreddit>` | none |
| A short link (`redd.it/…`) or a link with no subreddit (`/comments/…`) | the page's own title, usually "Reddit" | none |

The title comes from Reddit's oEmbed service, so a post gets a second request, also to reddit.com. If that lookup fails, the title is guessed from the words in the URL. A share link can take up to twice as long as other links, because the plugin has to find out which post it leads to first. Reddit cards have no description or picture, since Reddit only gives those to browsers.

### Special link handling setting

**Special link handling** is a new setting, on by default. While it's on, the sites that get their own handling are listed under it, each with its own toggle, also on by default:

- **Reddit:** the titles above. Off, Reddit links are titled just "Reddit", and nothing is sent to Reddit's oEmbed service.
- **YouTube:** the channel's handle in a card's `handle` line. Off, new cards show the channel name without storing the handle.

Turn the setting off to treat every link like any other page.

### Upgrading

No action is needed. Existing cards and links don't change, since a page is only fetched when a card or link is created. To give an existing Reddit link its title, paste it again.

## 0.7.1

### Pasting after inline code with mixed backticks

A normal paste (Ctrl/Cmd+V) now recognises inline code the way Markdown does, by pairing backtick runs of the same length. Some lines used to make it think the cursor was still inside inline code, so a URL pasted in ordinary text after them was left plain:

- a line with a double-backtick span that contains a single backtick, such as ``` ``a`b`` ```
- a line with an escaped backtick, such as `` \` ``

A URL pasted after those now becomes a link or card, as set under **When pasting a URL**. Pasting while you're still typing inline code, such as ``use `foo ``, leaves the URL as pasted, as before.

### Upgrading

No action is needed. Cards and settings are unchanged.

## 0.7.0

### Pasting into a link you're writing leaves the URL alone

A normal paste (Ctrl/Cmd+V) no longer turns a URL into a link or a card when the cursor is inside link syntax, where restyling it would break the link you're writing. The URL is pasted exactly as copied when the cursor is:

- between a link's `[` and `]`, including image alt text and a link whose `]` you haven't typed yet
- inside a wikilink, such as `[[Note`
- inside a link's `( )` URL, including one with parentheses of its own, as Wikipedia URLs have
- after any unclosed `[` earlier on the same line, even a stray one in prose: in `Notes [draft — https://…`, the URL stays plain

Task checkboxes like `- [ ]`, finished links, escaped brackets (`\[`) and brackets inside inline code don't count, so pasting after them works as before.

### Ctrl/Cmd+Shift+V works everywhere

The **Paste URL and choose style** shortcut now opens its Card / Link / Plain URL menu wherever the cursor is: inside link syntax, and also inside code blocks, inline code and the frontmatter, where it used to paste plain text without asking. It's a deliberate request, so it no longer second-guesses where you are.

In those places, choose **Plain URL** to keep the surrounding code block, link or properties intact. Card and Link insert their syntax there.

### Upgrading

No action is needed. Cards and settings are unchanged.

## 0.6.0

### YouTube cards record the channel's handle

A card made from a YouTube link now stores the channel's handle in a `handle` line, next to the channel name in `author`:

````markdown
```linkcard
url: https://www.youtube.com/watch?v=jNQXAC9IVRw
title: Me at the zoo
author: jawed
handle: @jawed
```
````

The handle is **not shown in the card**. It lives in the card's source only, so the card looks the same as before and the handle is there for search and your own reference.

Which links get one:

| Pasted link | `handle` |
| --- | --- |
| A video, including `youtu.be` links | the channel's handle |
| A Short | the channel's handle |
| A channel page pasted as `youtube.com/@handle` | that handle |
| A channel page pasted by its ID, or a playlist | none |
| Any page that is not YouTube | none |

### Upgrading

No action is needed. Cards you already have are unchanged, because a card is only fetched once, when it is created. To give one a handle, add a `handle:` line by hand, or convert the card to a link and back to a card to fetch the page again.
