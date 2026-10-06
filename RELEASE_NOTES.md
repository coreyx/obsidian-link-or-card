# Link or Card 0.2.0

## Skip the menu for URLs you choose

Some URLs you always want pasted as they are: your own wiki, a local dev server, an internal tracker. The new **Don't ask for these URLs** setting takes a list of them, one per line, and pastes anything on it normally, without the Card / Link / Plain URL menu.

| Entry | Skips the menu for |
| --- | --- |
| `example.com` | `example.com` and its subdomains, such as `docs.example.com` |
| `github.com/my-org` | that path and everything under it, but not `github.com/my-org-archive` |
| `localhost:3000` | that port only |

You can paste entries straight from the address bar: `https://` and a leading `*.` are accepted and ignored.

The list only affects the menu shown on paste. You can still right-click an ignored URL, or run **Change link style at cursor**, to turn it into a card or a link.

The list is empty by default, so nothing changes until you add an entry.

## Install with BRAT

The README now explains how to install and update the plugin with [BRAT](https://github.com/TfTHacker/obsidian42-brat), using `https://github.com/coreyx/obsidian-link-or-card`.

## Upgrading

No action is needed. Existing settings and cards are unchanged.
