---
status: approved
---

# Match inline code spans by backtick run length

A normal paste decides whether the cursor is inside inline code by counting backticks before it, and strips finished code spans with a regex that can backtrack into a run. Both go wrong when a line mixes backtick runs of different lengths. This replaces them with one scanner that pairs runs by exact length, as CommonMark does.

**Related documents**
- [Paste in link brackets walkthrough](../paste-in-link-brackets/walkthrough.md)

## User Review Required

> [!NOTE]
> Some pastes that are left alone today will be restyled after the fix, because the cursor turns out to be in prose. For example, after ``` ``a`[`` and ``` (a finished double-backtick span) or after an escaped backtick such as `` \` and ``. No paste that is restyled today becomes a plain paste, except where the old code missed an unfinished span, as in ``` ``a`[ ```, which is already left alone for a different reason.

> [!NOTE]
> A backtick run with no matching run before the cursor still counts as inline code being typed, so ``use `foo `` keeps leaving the paste alone. One consequence is that in ``` ``a `b` c ``` the unmatched `` `` `` makes the rest of the line count as code, even though CommonMark would render `` `` `` as literal text when nothing on the line closes it. That case still gets a plain paste, which is harmless, and it keeps the check working while inline code is being typed.

## Open Questions

None at this time.

## Proposed Changes

### Paste position checks

#### [MODIFY] `src/editorText.ts`
- [x] **TASK-1:** Add a private `scanInlineCode(before)` that walks the text before the cursor and returns `{ prose, open }`.
  - Outside a span, a backslash escapes the next character, a backtick included, and both are kept in `prose`.
  - A run of n backticks opens a span that closes at the next run of exactly n backticks. A longer or shorter run inside the span doesn't close it, and the whole span is dropped from `prose`.
  - A run with no closing run before the cursor sets `open: true`.
  - Remove `CODE_SPAN`. `isInsideLinkSyntax` takes the already-stripped prose, and `canTransformPaste` refuses when `open` is true in place of the odd-backtick count. TSDoc on the new function says why runs are paired by length.

### Tests

#### [MODIFY] `tests/editorText.test.ts`
- [x] **TASK-2:** Add `pasteAt` cases for mixed runs. The existing inline-code and link cases stay as they are and must still pass.
  - ``` ``a`[`` and | ``` allows.
  - ``` ``a`| ``` and ``` ``a`[| ``` refuse, since the cursor is inside an unfinished span.
  - ```` ```a`` | ```` refuses, since a two-backtick run doesn't close a three-backtick span.
  - `` `a``b` [| `` refuses, because of the bracket after a finished span.
  - `` \` and | `` allows, and `` \`[| `` refuses because of the bracket.

### Docs

#### [MODIFY] `CHANGELOG.md`
- [x] **TASK-3:** Add a `### Fixed` entry under `[Unreleased]`: inline code is now recognised by matching backtick runs, so lines that mix single and double backticks, or contain an escaped backtick, are judged correctly when pasting.

## Verification Plan

### Automated Tests
This repo uses vitest in `tests/` instead of a `scratch/` script, as agreed for the previous spec.
1. The new `pasteAt` cases in `tests/editorText.test.ts` pass.
2. The existing tests still pass, including ``use `foo `` refusing and `` `a[0` and | `` allowing.
3. `npm run check` passes: typecheck, tests, plugin checks and the production build.

### Manual Verification
In a vault with this build installed and **When pasting a URL** set to **Link**, copy `https://example.com` and:
1. On a new line, type ``` ``a`b`` and ``` and paste with Ctrl/Cmd+V. It becomes `[Example Domain](https://example.com)`.
2. On a new line, type ``` ``a` ``` and paste. The bare URL is inserted.
3. On a new line, type ``use `foo `` and paste. The bare URL is inserted, as before.
