---
status: approved
---

# Leave pastes inside link brackets and link URLs alone

A URL pasted between a Markdown link's `[` and `]`, or inside its `( )` destination, is currently restyled like any other paste: it becomes a titled link, a card, or opens the menu, which breaks the link being written. This change makes `canTransformPaste` refuse those positions, so a normal paste there is plain text, the same way code blocks and inline code are already handled. The Ctrl/Cmd+Shift+V shortcut, being a deliberate request that always offers Plain URL, stops applying position checks at all.

## User Review Required

> [!IMPORTANT]
> Any unclosed `[` earlier on the same line blocks restyling of a normal paste for the rest of that line, including a stray one in prose. In `Notes [draft — https://…`, the URL is pasted as plain text. Agreed in scoping as the trade-off for catching a link whose `]` has not been typed yet.

> [!IMPORTANT]
> The Ctrl/Cmd+Shift+V command ("Paste URL and choose style") will show the menu wherever the cursor is: inside link brackets and link URLs, and also inside code blocks, inline code and the frontmatter, where it pastes plain text today. Choosing **Card** or **Link** in those places inserts that syntax there and can break the surrounding code block or properties; **Plain URL** is the choice that keeps them intact.

> [!NOTE]
> Brackets inside a finished inline code span (`` `a[0]` ``) and escaped brackets (`\[`) are not counted, so neither opens a bracket.

> [!NOTE]
> The shortcut's selection rules are unchanged: with **Preserve selection as title** off, or a selection it cannot use as a title (more than one line, already a link, several selections), it still pastes the clipboard over the selection as plain text.

## Open Questions

None at this time.

## Proposed Changes

### Paste position check

#### [MODIFY] `src/editorText.ts`
- [x] **TASK-1:** Add a module-private `isInsideLinkSyntax(before: string): boolean`, with a TSDoc comment, and make `canTransformPaste` return `false` when it is true.
  - Remove finished inline code spans from `before` first, matching backtick runs of equal length (`` /(`+)[\s\S]*?\1/g ``), so brackets and parentheses inside them are ignored. An unclosed span is already refused by the existing odd-backtick check.
  - Walk the remaining text one character at a time:
    - `\` skips the next character.
    - `[` raises the bracket depth by one; `]` lowers it by one, never below zero.
    - `]` immediately followed by `(` starts a link destination, whatever the bracket depth was. Inside a destination, `(` and `)` are counted so that a URL such as `Foo_(bar)` does not end it early, and brackets are ignored. The destination ends when its parentheses balance.
  - Return `true` when the walk ends with the bracket depth above zero, or inside a destination.
  - In `canTransformPaste`, drop the `\]\(\s*` alternative from the trailing-syntax regex, since `isInsideLinkSyntax` covers it, and keep `<` and `=["']`. Update its TSDoc to name the link text and destination cases, and to say that only a normal paste consults it.

### Shortcut

#### [MODIFY] `main.ts`
- [ ] **TASK-2:** Let the shortcut skip the position check.
  - Give `insertPastedUrl(editor, url)` a third parameter, `checkPosition: boolean`, and call `canTransformPaste` only when it is `true`. Update its TSDoc to say when the check is skipped and why.
  - `handlePaste` passes `true`; `pasteAndChoose` passes `false`.
  - Update the TSDoc on `pasteAndChoose` to say it ignores the cursor's surroundings as well as the paste setting and the ignore list.

### Tests

#### [MODIFY] `tests/editorText.test.ts`
- [ ] **TASK-3:** Add cases to the `canTransformPaste` describe block.
  - Refused: inside an existing link's text (`[some |title](url)`), inside image alt text (`![alt |](img.png)`), a link being typed with and without the auto-paired bracket (`[|]`, `[|`), inside a wikilink (`[[Note|`), after a stray `[` in prose, right after `](`, in the middle of a link's URL (`](https://a.com/|)`), and inside a URL that has its own parentheses (`](https://en.wikipedia.org/wiki/Foo_(bar|`).
  - Still allowed: after a task checkbox (`- [ ] task |`), after a finished link (`see [docs](url) and |`), after a finished link whose URL has parentheses, after an escaped bracket (`\[not a link |`), and after brackets inside a finished inline code span (`` `a[0` and | ``).

### Documentation

#### [MODIFY] `README.md`
- [ ] **TASK-4:** Update the paste rules.
  - In "When a paste is left alone", replace the "being typed into Markdown or HTML syntax" bullet with one that names the link text, the link's `( )` URL, wikilinks and any unclosed `[` earlier on the line, plus the existing `<` and `href="` cases. Say that this list applies to a normal paste only.
  - In "Choosing for one paste", say that the shortcut shows the menu wherever the cursor is, including inside code and links, so **Plain URL** is the choice there.

#### [MODIFY] `CHANGELOG.md`
- [ ] **TASK-5:** Under `## [Unreleased]`, add a `### Fixed` entry for the new positions where a normal paste is left alone, including the stray `[` behavior, and a `### Changed` entry saying the shortcut now shows the menu everywhere, including inside code blocks, inline code and the frontmatter.

## Verification Plan

### Automated Tests
This repo already tests `canTransformPaste` with vitest, so the new checks go in `tests/editorText.test.ts` rather than a `scratch/` script, as agreed in scoping. `npm run check` must pass: typecheck, the full vitest suite, the plugin review checks and the production build. It verifies:

1. Every refused position listed in TASK-3 returns `false`.
2. Every allowed position listed in TASK-3 still returns `true`.
3. The existing `canTransformPaste` cases (code fences, frontmatter, inline code, `<`, `href="`) still pass.

The shortcut change in TASK-2 lives in `main.ts`, which the suite does not load because it imports Obsidian. It is covered by the typecheck and by manual steps 7 and 8.

### Manual Verification
In a vault with this build installed and **When pasting a URL** set to **Link**, copy `https://example.com` and:

1. Type `[`, letting Obsidian add the closing `]`, then paste with Ctrl/Cmd+V. The bare URL appears between the brackets, with no notice and no change afterwards.
2. In an existing `[Example](https://obsidian.md)`, put the cursor after `Exa` and paste. The URL is inserted as plain text.
3. Put the cursor after `https://obsidian.md` inside the parentheses of the same link and paste. The URL is inserted as plain text.
4. Type `[[` and paste. The URL is inserted as plain text.
5. On a new line, type `see ` and paste. It becomes `[Example Domain](https://example.com)`, as before.
6. On a new line, type `- [ ] task ` and paste. It becomes a titled link, as before.
7. With the cursor between `[` and `]`, press Ctrl/Cmd+Shift+V. The URL is pasted and the Card / Link / Plain URL menu opens; choosing **Plain URL** leaves the bare URL between the brackets.
8. Inside a fenced code block, press Ctrl/Cmd+Shift+V. The menu opens; choosing **Plain URL** leaves the bare URL in the code block.
