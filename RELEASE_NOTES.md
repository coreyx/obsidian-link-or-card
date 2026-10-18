# Release notes

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
