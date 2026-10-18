# Walkthrough: Leave pastes inside link brackets and link URLs alone

A normal paste (Ctrl/Cmd+V) no longer restyles a URL pasted inside link syntax: a link's text, image alt text, a wikilink, a link's `( )` URL, or anywhere after an unclosed `[` on the same line. The paste-and-choose shortcut (Ctrl/Cmd+Shift+V) now skips every position check and opens its menu wherever the cursor is.

## What Was Implemented

### 1. Paste position check
- **`src/editorText.ts`**: new module-private `isInsideLinkSyntax(before)`. It removes finished inline code spans, then walks the text before the cursor counting brackets, skipping escaped characters. A `]` directly followed by `(` starts a link destination, whose own balanced parentheses (as in Wikipedia URLs) do not end it. It returns `true` for an open bracket or an unfinished destination. `canTransformPaste` refuses the paste when it is true, and its old "right after `](`" rule is now covered by the helper. Its TSDoc names the new cases and says only a normal paste consults it.

### 2. Shortcut
- **`main.ts`**: `insertPastedUrl` takes a `checkPosition` flag. `handlePaste` passes `true`; `pasteAndChoose` passes `false`, so the shortcut opens the menu inside code blocks, inline code, the frontmatter and link syntax too. The TSDoc on both says why: the shortcut is a deliberate request and its menu always offers Plain URL.

### 3. Tests
- **`tests/editorText.test.ts`**: four new `canTransformPaste` cases, using a `pasteAt("…|…")` helper where `|` marks the cursor. They cover 10 refused positions and 6 that must still be restyled.

### 4. Documentation
- **`README.md`**: "When a paste is left alone" lists the link-syntax and stray-`[` cases and says the list applies to a normal paste only. "Choosing for one paste" says the shortcut works wherever the cursor is and that Plain URL keeps surrounding syntax intact.
- **`CHANGELOG.md`**: a `Fixed` entry for the link-syntax positions and a `Changed` entry for the shortcut, under `[Unreleased]`.

## Verification & Test Results

### Automated Tests
Ran `npm run check` (typecheck, vitest, plugin review checks, production build) after each task and once more at the end:
- Refused positions return `false`: link text, image alt text, `[|]` and `[|`, `[[Note|`, a stray `[` in prose, right after `](` and `]( `, mid-URL, and inside a URL with its own parentheses: **Passed**
- Allowed positions return `true`: after `- [ ]` and `- [x]` checkboxes, after a finished link, after a finished link whose URL has parentheses, after `\[`, after `[` inside finished inline code: **Passed**
- Final run: 101 tests in 9 files, plugin checks and build: **Passed**

One case I added beyond the plan, `` ``a`[`` and | ``, failed: it returned `false` where I expected `true`. The cause is the existing odd-backtick check, which counts every backtick and so treats that line's five backticks as an unclosed code span. That predates this change and isn't part of it, so I removed the case rather than change that check. It is listed under Follow-ups.

Before committing TASK-1, I also ran a throwaway script against the built module for the same 15 positions. All passed.

### Regression Testing
The existing `canTransformPaste` cases (code fences, frontmatter, fence lines, inline code, `[title](`, `<`, `<img src="`) and the rest of the suite pass unchanged.

The `main.ts` change is not covered by the suite, which cannot load Obsidian. It passes the typecheck and the build, and needs the manual steps below.

## Manual Verification
In a vault with this build installed and **When pasting a URL** set to **Link**, copy `https://example.com` and:

1. Type `[`, letting Obsidian add the closing `]`, then paste with Ctrl/Cmd+V. The bare URL appears between the brackets, with no notice and no change afterwards.
2. In an existing `[Example](https://obsidian.md)`, put the cursor after `Exa` and paste. The URL is inserted as plain text.
3. Put the cursor after `https://obsidian.md` inside the parentheses of the same link and paste. The URL is inserted as plain text.
4. Type `[[` and paste. The URL is inserted as plain text.
5. On a new line, type `see ` and paste. It becomes `[Example Domain](https://example.com)`, as before.
6. On a new line, type `- [ ] task ` and paste. It becomes a titled link, as before.
7. With the cursor between `[` and `]`, press Ctrl/Cmd+Shift+V. The URL is pasted and the Card / Link / Plain URL menu opens; choosing **Plain URL** leaves the bare URL between the brackets.
8. Inside a fenced code block, press Ctrl/Cmd+Shift+V. The menu opens; choosing **Plain URL** leaves the bare URL in the code block.

## Follow-ups
- **Mixed-length backtick runs:** the odd-backtick check counts backticks rather than code spans, so a line such as `` ``a`[`` and `` is treated as inside inline code and a normal paste after it is left alone. That's harmless (a plain paste), but it could be made exact by checking spans the way `isInsideLinkSyntax` strips them.
- **Shortcut selection rules:** the shortcut still pastes plain text over a selection it can't use as a title (several lines, already a link, several selections, or Preserve selection as title off). This was left as it is in the plan.
- **Not released:** the work is on `fix/paste-in-link-brackets` and isn't merged into `main` or released.
