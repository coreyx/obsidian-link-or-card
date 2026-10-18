import { CARD_LANGUAGE } from "./cardBlock";

/** Obsidian's Editor satisfies this, so the functions below run on it directly. */
export interface LineSource {
  getLine(line: number): string;
  lineCount(): number;
}

/** Blockquote markers, then an optional list marker (with task checkbox). */
const CONTAINER = /^(\s*(?:>\s?)*)(\s*(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?)?/;
const FENCE = /^(`{3,}|~{3,})(.*)$/;
const CARD_OPENER = new RegExp("^`{3,}\\s*" + CARD_LANGUAGE + "\\s*$");
const CLOSER = /^`{3,}\s*$/;

const stripContainer = (text: string): string => text.slice(CONTAINER.exec(text)?.[0].length ?? 0).trimStart();

export function isInsideCodeFence(doc: LineSource, line: number): boolean {
  let open: { char: string; length: number } | null = null;
  for (let i = 0; i < line; i++) {
    const match = FENCE.exec(stripContainer(doc.getLine(i)));
    if (match === null) continue;
    const run = match[1] ?? "";
    if (open === null) open = { char: run.charAt(0), length: run.length };
    else if (run.charAt(0) === open.char && run.length >= open.length && (match[2] ?? "").trim() === "") open = null;
  }
  return open !== null;
}

export function isInsideFrontmatter(doc: LineSource, line: number): boolean {
  if (doc.getLine(0).trimEnd() !== "---") return false;
  const count = doc.lineCount();
  for (let i = 1; i < count; i++) {
    if (/^(---|\.\.\.)\s*$/.test(doc.getLine(i))) return line <= i;
  }
  return false;
}

/** Length of the run of backticks starting at index. */
function backtickRun(text: string, index: number): number {
  let end = index;
  while (text.charAt(end) === "`") end++;
  return end - index;
}

/** Start of the next run of exactly `length` backticks at or after `from`, or -1. */
function findBacktickRun(text: string, from: number, length: number): number {
  for (let i = text.indexOf("`", from); i !== -1; ) {
    const run = backtickRun(text, i);
    if (run === length) return i;
    i = text.indexOf("`", i + run);
  }
  return -1;
}

/**
 * The text before the cursor with finished inline code spans removed, and whether
 * a span is still open at the cursor. Runs are paired by exact length, as in
 * CommonMark: in ``a`b`` the single backtick is code, not the start of another
 * span, so counting backticks would misjudge the line. Outside code a backslash
 * escapes the next character, so \` is a literal backtick. A run with no partner
 * before the cursor counts as code still being typed.
 */
function scanInlineCode(before: string): { prose: string; open: boolean } {
  let prose = "";
  let i = 0;
  while (i < before.length) {
    const char = before.charAt(i);
    if (char === "\\") {
      prose += before.slice(i, i + 2);
      i += 2;
    } else if (char === "`") {
      const run = backtickRun(before, i);
      const close = findBacktickRun(before, i + run, run);
      if (close === -1) return { prose, open: true };
      i = close + run;
    } else {
      prose += char;
      i++;
    }
  }
  return { prose, open: false };
}

/**
 * Whether prose before the cursor, with code spans already removed, leaves it
 * inside link syntax: an unclosed `[` (link text, image alt text, a wikilink, or
 * a stray bracket in prose), or the `( )` destination of a link. A URL pasted
 * there is part of the link being written, so restyling it would break that
 * link. Escaped characters do not count.
 */
function isInsideLinkSyntax(text: string): boolean {
  let brackets = 0;
  // Open parentheses of the link destination being read; 0 outside one.
  let parens = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === "\\") {
      i++;
    } else if (parens > 0) {
      // A destination may hold balanced parentheses of its own, as Wikipedia URLs do.
      if (char === "(") parens++;
      else if (char === ")") parens--;
    } else if (char === "[") {
      brackets++;
    } else if (char === "]") {
      brackets = Math.max(0, brackets - 1);
      if (text.charAt(i + 1) === "(") {
        parens = 1;
        i++;
      }
    }
  }
  return brackets > 0 || parens > 0;
}

/**
 * Whether a URL pasted at (line, ch) is prose we may restyle, rather than part of
 * other syntax: a code block, inline code, the frontmatter, a link's text or its
 * `( )` URL, or an HTML tag or attribute being typed. Only a normal paste asks;
 * the paste-and-choose command restyles wherever the user invokes it.
 */
export function canTransformPaste(doc: LineSource, line: number, ch: number): boolean {
  const text = doc.getLine(line);
  const before = text.slice(0, ch);
  if (isInsideFrontmatter(doc, line) || isInsideCodeFence(doc, line)) return false;
  if (FENCE.test(stripContainer(text))) return false;
  const code = scanInlineCode(before);
  if (code.open || isInsideLinkSyntax(code.prose)) return false;
  if (/(<|=["'])$/.test(before)) return false;
  return true;
}

/**
 * The part of a selection that can become a link's text, with its offset in the
 * selection so the whitespace around it stays outside the link. Null when the
 * selection is blank, spans lines, or already holds a link that would end up nested.
 */
export function titleInSelection(selection: string): { title: string; offset: number } | null {
  const title = selection.trim();
  if (title === "" || /[\r\n]/.test(title)) return null;
  if (/https?:\/\/|\[\[|\]\(/i.test(title)) return null;
  return { title, offset: selection.indexOf(title) };
}

export type LinkAt =
  | { kind: "bare"; from: number; to: number; url: string }
  | { kind: "markdown"; from: number; to: number; url: string; text: string };

const MARKDOWN_LINK = /\[((?:\\.|[^\\\]])*)\]\(\s*<?(https?:\/\/(?:[^\s()<>]|\([^\s()<>]*\))+)>?\s*\)/g;
const BARE_URL = /https?:\/\/[^\s<>"'`[\]]+/g;

const count = (text: string, char: string) => text.split(char).length - 1;

/** Sentence punctuation after a URL, or a closing paren that belongs to the prose, is not part of it. */
function trimUrlEnd(url: string): string {
  let end = url.length;
  while (end > 0) {
    const last = url.charAt(end - 1);
    const head = url.slice(0, end);
    if (".,;:!?".includes(last) || (last === ")" && count(head, "(") < count(head, ")"))) end--;
    else break;
  }
  return url.slice(0, end);
}

export function findLinkAt(line: string, ch: number): LinkAt | null {
  const taken: [number, number][] = [];
  for (const match of line.matchAll(MARKDOWN_LINK)) {
    const from = match.index ?? 0;
    const to = from + match[0].length;
    const isImage = from > 0 && line.charAt(from - 1) === "!";
    taken.push([isImage ? from - 1 : from, to]);
    if (!isImage && ch >= from && ch <= to) {
      return { kind: "markdown", from, to, url: match[2] ?? "", text: (match[1] ?? "").replace(/\\(.)/g, "$1") };
    }
  }
  for (const match of line.matchAll(BARE_URL)) {
    const from = match.index ?? 0;
    const url = trimUrlEnd(match[0]);
    const to = from + url.length;
    if (taken.some(([start, end]) => from >= start && from < end)) continue;
    if (ch >= from && ch <= to) return { kind: "bare", from, to, url };
  }
  return null;
}

export interface CardBlockAt {
  startLine: number;
  endLine: number;
  /** Block body with blockquote and list indentation removed, ready for parseCardBlock. */
  source: string;
}

export function findCardBlockAt(doc: LineSource, line: number): CardBlockAt | null {
  const at = (i: number) => stripContainer(doc.getLine(i));
  let start = line;
  // On a closing fence, the opener is above; do not read the closer as an opener.
  if (CLOSER.test(at(start))) start--;
  while (start >= 0 && !FENCE.test(at(start))) start--;
  if (start < 0 || !CARD_OPENER.test(at(start))) return null;

  const lines = doc.lineCount();
  let end = start + 1;
  while (end < lines && !CLOSER.test(at(end))) end++;
  if (end >= lines || end < line) return null;

  const source: string[] = [];
  for (let i = start + 1; i < end; i++) source.push(at(i));
  return { startLine: start, endLine: end, source: source.join("\n") };
}

/**
 * Text that replaces line[from..to] with a fenced block. A fence must start
 * its own line, and inside a list item or blockquote every following line
 * needs the same indentation or `>` to stay in that container.
 */
export function blockReplacement(line: string, from: number, to: number, block: string): string {
  const match = CONTAINER.exec(line);
  const quote = match?.[1] ?? "";
  const list = match?.[2] ?? "";
  const continuation = quote + " ".repeat(list.length);
  const ownLine = line.slice(0, from).trim() === (quote + list).trim();

  const [first = "", ...rest] = block.split("\n");
  let text = (ownLine ? "" : "\n" + continuation) + first;
  for (const blockLine of rest) text += "\n" + continuation + blockLine;
  if (line.slice(to).trim() !== "") text += "\n" + continuation;
  return text;
}

/** The URL may have moved while its page was being fetched; find the copy closest to where it was. */
export function locateNearest(text: string, needle: string, expectedOffset: number): number {
  let best = -1;
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) {
    if (best === -1 || Math.abs(i - expectedOffset) < Math.abs(best - expectedOffset)) best = i;
  }
  return best;
}
