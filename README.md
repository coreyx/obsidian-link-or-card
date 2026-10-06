# Link or Card

Paste a URL and it lands in your note as a titled link. Press **Ctrl/Cmd+Shift+V** instead to pick how it lands:

| Choice | Result |
| --- | --- |
| **Card** | A preview card with the page title, description, thumbnail and site icon |
| **Link** | `[Page title](https://…)` — a Markdown link with the title filled in |
| **Plain URL** | The URL exactly as pasted |

The URL is pasted immediately, then restyled once the page has been read. If the page cannot be read, or you close the menu, the plain URL stays, so the plugin never gets in the way of an ordinary paste.

## Usage

### When pasting

Copy a URL and paste it into a note. It becomes a **Link**: the URL appears at once and turns into `[Page title](https://…)` when the title arrives.

What a normal paste produces is up to you: [**When pasting a URL**](#settings) can be set to **Link**, **Card**, **Plain URL** or **Ask with a menu**.

### Choosing for one paste

Press **Ctrl+Shift+V** (**Cmd+Shift+V** on macOS), or run the command **Paste URL and choose style**, to paste the URL and choose **Card**, **Link** or **Plain URL** from a menu at the cursor. This works whatever the paste setting is, and for URLs on your ignore list too.

The shortcut takes the place of Obsidian's own *paste as plain text* on the same keys. Clipboard content that is not a single URL is still pasted as plain text, and you can change or remove the shortcut under *Settings → Hotkeys*.

### When a paste is left alone

A normal paste is not restyled when it is clearly something else:

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

- **When pasting a URL** — what a normal paste turns a URL into. The shortcut, the right-click menu and the commands work with every choice.

  | Choice | A pasted URL |
  | --- | --- |
  | **Link** (default) | becomes a Markdown link with the page title |
  | **Card** | becomes a preview card |
  | **Plain URL** | is left alone; the plugin does nothing on paste |
  | **Ask with a menu** | is pasted, and a menu offers Card, Link or Plain URL |

- **Ignore these URLs** — URLs that a normal paste should always leave alone, one per line. The shortcut, the right-click menu and the commands still work on them.

  | Entry | Leaves alone |
  | --- | --- |
  | `example.com` | `example.com` and its subdomains, such as `docs.example.com` |
  | `github.com/my-org` | that path and everything under it, but not `github.com/my-organization` |
  | `localhost:3000` | that port only |

  `https://` and a leading `*.` are accepted and ignored, so `https://*.example.com/` means the same as `example.com`.
- **Preserve selection as title** — on by default. Pasting a URL over selected text keeps that text as the title instead of the page's own title:
  - the selection becomes `[selected text](https://…)` right away
  - **Link** keeps that link as it is, with no request; **Card** builds a card titled with the selected text; **Plain URL** replaces the selection with the URL
  - closing the menu, when there is one, keeps the link

  The paste is still left to Obsidian when the selection spans more than one line, already contains a link, or there are several selections. Turn the setting off to leave every paste over a selection to Obsidian.

## Network use

To build a card or a titled link, the plugin sends one `GET` request to the URL, using Obsidian's `requestUrl`, and reads the page's `<title>`, Open Graph and Twitter card tags. Nothing is sent anywhere else.

With **When pasting a URL** set to **Link** (the default) or **Card**, that request is made as soon as you paste a URL, without asking. No request is made when:

- the URL is on your ignore list
- the setting is **Plain URL**, or it is **Ask with a menu** and you choose **Plain URL** or close the menu
- you paste over selected text and the result is a link, since the selection is the title

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
