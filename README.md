# Link or Card

Paste a URL and pick how it lands in your note:

| Choice | Result |
| --- | --- |
| **Card** | A preview card with the page title, description, thumbnail and site icon |
| **Link** | `[Page title](https://…)` — a Markdown link with the title filled in |
| **Plain URL** | The URL exactly as pasted |

The URL is pasted immediately and the menu opens at the cursor. Pressing Esc or clicking elsewhere keeps the plain URL, so the plugin never gets in the way of an ordinary paste.

## Usage

### When pasting

Copy a URL, paste it into a note, and choose **Card**, **Link** or **Plain URL** from the menu.

The menu does not appear when the paste is clearly something else:

- text is selected and [**Preserve selection as title**](#settings) is off (the paste is left to Obsidian)
- the cursor is in a code block, inline code or the frontmatter
- the URL is being typed into Markdown or HTML syntax, such as right after `](`, `<` or `href="`
- the clipboard holds more than a single URL
- the URL is on your [ignore list](#settings)

### Changing it later

- **Right-click** a URL, a Markdown link or a rendered card and choose *Convert to card*, *Convert to link* or *Convert to plain URL*.
- Or run the command **Change link style at cursor**, and bind a hotkey to it if you like.

Converting a card to a link reuses the title stored in the card, so no request is made.

## How cards are stored

A card is a fenced code block with one `key: value` per line:

````markdown
```linkcard
url: https://obsidian.md/
title: Obsidian - Sharpen your thinking
description: The free and flexible app for your private thoughts.
image: https://obsidian.md/images/banner.png
favicon: https://obsidian.md/favicon.ico
site: Obsidian
```
````

- The page is fetched **once**, when the card is created. Opening the note later does not contact the site, and the card keeps working offline apart from the images.
- Only `url` is required. Edit any line by hand to change what the card shows.
- Without the plugin, the block is still readable text with the URL in it.
- Cards work inside list items and blockquotes.

## Settings

- **Ask when pasting a URL** — turn off to paste URLs normally. The right-click menu and the command still work.
- **Don't ask for these URLs** — URLs that should always paste normally, one per line. The right-click menu and the command still work on them.

  | Entry | Skips the menu for |
  | --- | --- |
  | `example.com` | `example.com` and its subdomains, such as `docs.example.com` |
  | `github.com/my-org` | that path and everything under it, but not `github.com/my-organization` |
  | `localhost:3000` | that port only |

  `https://` and a leading `*.` are accepted and ignored, so `https://*.example.com/` means the same as `example.com`.
- **Preserve selection as title** — on by default. Pasting a URL over selected text keeps that text as the title instead of the page's own title:
  - the selection becomes `[selected text](https://…)` right away, and the menu opens as usual
  - **Card** builds a card titled with the selected text; **Link** keeps the link as it is, with no request; **Plain URL** replaces the selection with the URL
  - closing the menu keeps the link

  The paste is still left to Obsidian when the selection spans more than one line, already contains a link, or there are several selections. This setting needs **Ask when pasting a URL** to be on. Turn it off to leave every paste over a selection to Obsidian.

## Network use

To build a card or a titled link, the plugin sends one `GET` request to the URL you chose, using Obsidian's `requestUrl`, and reads the page's `<title>`, Open Graph and Twitter card tags. Nothing is sent anywhere else, and no request is made when you choose **Plain URL** or close the menu.

Card images and icons are loaded from the sites that host them, with `referrerpolicy="no-referrer"`.

Some sites return little or no metadata to requests that are not from a browser. The card then falls back to the host name, and the link falls back to the plain URL with a notice.

## Installing with BRAT

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs the plugin straight from this repository and keeps it up to date.

1. Install **BRAT** from *Settings → Community plugins* and enable it.
2. Open *Settings → BRAT* and choose **Add beta plugin**.
3. Paste `https://github.com/coreyx/obsidian-link-or-card`, pick the latest version and choose **Add plugin**.
4. Enable **Link or Card** under *Settings → Community plugins*.

BRAT checks for new releases when Obsidian starts. To check right away, run the command **BRAT: Check for updates to all beta plugins and UPDATE**.

## Installing manually

Copy `main.js`, `manifest.json` and `styles.css` from the latest release into `<vault>/.obsidian/plugins/link-or-card/`, then enable **Link or Card** under *Settings → Community plugins*.

Works on desktop and mobile.

## Development

```bash
npm install
npm run dev     # rebuild on change
npm run check   # typecheck, tests, review checks and production build
```

## License

MIT
