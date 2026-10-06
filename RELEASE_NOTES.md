# Link or Card 0.4.0

## Pasting a URL now makes a link, without asking

Paste a URL and it becomes a titled link straight away: the URL appears at once and turns into `[Page title](https://…)` when the title arrives. No menu opens. If the page cannot be read, the plain URL stays and a notice tells you.

## Ctrl/Cmd+Shift+V to choose

When you want something other than a link, press **Ctrl+Shift+V** (**Cmd+Shift+V** on macOS) instead. The URL is pasted and the **Card** / **Link** / **Plain URL** menu opens at the cursor.

- It is a command, **Paste URL and choose style**, so you can change or remove the shortcut under *Settings → Hotkeys*.
- It works whatever the paste setting is, and for URLs on your ignore list too.
- These keys are Obsidian's own *paste as plain text*. The plugin takes them over, and still pastes plain text when the clipboard is not a single URL.

## Choose what a normal paste does

The **Ask when pasting a URL** toggle is replaced by **When pasting a URL**:

| Choice | A pasted URL |
| --- | --- |
| **Link** (default) | becomes a Markdown link with the page title |
| **Card** | becomes a preview card |
| **Plain URL** | is left alone; the plugin does nothing on paste |
| **Ask with a menu** | is pasted, and a menu offers Card, Link or Plain URL, as in earlier versions |

**Don't ask for these URLs** is now called **Ignore these URLs**. Your list is kept.

## Upgrading

- **Pasting behaves differently.** To get the menu on every paste again, set **When pasting a URL** to **Ask with a menu**.
- **If you had turned off "Ask when pasting a URL"**, the new setting starts as **Plain URL**, so pasting still does nothing.
- **Pages are now requested as soon as you paste.** With **Link** or **Card**, the plugin contacts the pasted URL without asking first. Add sites to **Ignore these URLs**, or choose **Plain URL** or **Ask with a menu**, if you do not want that.
- **Ctrl/Cmd+Shift+V no longer reaches Obsidian's paste as plain text** while the plugin's shortcut is bound to it. Remove the shortcut under *Settings → Hotkeys* to get it back.
