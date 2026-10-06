# Link or Card 0.3.0

## Keep your selected text as the title

Select some text, paste a URL over it, and the text you selected is now the title, instead of whatever title the page gives itself.

When you paste a URL over a selection:

- the selection becomes `[selected text](https://…)` right away, and the Card / Link / Plain URL menu opens
- **Card** builds a card titled with your selected text
- **Link** keeps the link as it is, without contacting the site
- **Plain URL** replaces the selection with the URL
- closing the menu keeps the link

Spaces at the edges of the selection stay outside the link.

This is controlled by the new **Preserve selection as title** setting, which is on by default. Turn it off to leave pastes over a selection to Obsidian, as in earlier versions.

The paste is also left to Obsidian when the selection spans more than one line, already contains a link, or there are several selections. The setting needs **Ask when pasting a URL** to be on, and URLs on your ignore list still paste normally.

## Upgrading

Pasting a URL over selected text behaves differently after this update, because the new setting is on by default. Turn off **Preserve selection as title** if you prefer the old behaviour.
