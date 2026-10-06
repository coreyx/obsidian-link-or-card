import { MarkdownView, Menu, Notice, Plugin, moment, requestUrl } from "obsidian";
import type { Editor, EditorPosition, MarkdownFileInfo, MarkdownPostProcessorContext } from "obsidian";
import { CARD_LANGUAGE, formatCardBlock, parseCardBlock } from "./src/cardBlock";
import type { CardData } from "./src/cardBlock";
import { renderCard } from "./src/cardView";
import {
  blockReplacement,
  canTransformPaste,
  findCardBlockAt,
  findLinkAt,
  isInsideCodeFence,
  isInsideFrontmatter,
  locateNearest,
} from "./src/editorText";
import { fetchMetadata } from "./src/fetchMetadata";
import type { Requester } from "./src/fetchMetadata";
import { getStrings } from "./src/i18n";
import type { Strings } from "./src/i18n";
import { formatMarkdownLink } from "./src/markdownLink";
import { DEFAULT_SETTINGS, LinkOrCardSettingTab } from "./src/settings";
import type { LinkOrCardSettings } from "./src/settings";
import { isIgnoredUrl, parsePastedUrl, safeHttpUrl } from "./src/url";

type Style = "card" | "link" | "plain";

type Target =
  | { kind: "bare"; from: EditorPosition; to: EditorPosition; url: string }
  | { kind: "markdown"; from: EditorPosition; to: EditorPosition; url: string; text: string }
  | { kind: "card"; from: EditorPosition; to: EditorPosition; data: CardData };

interface EditorContext {
  editor: Editor;
  info: MarkdownView | MarkdownFileInfo;
}

/** What each kind of link can become; its current form is never offered. */
const CONVERSIONS: Record<Target["kind"], Style[]> = {
  bare: ["card", "link"],
  markdown: ["card", "plain"],
  card: ["link", "plain"],
};

const ICONS: Record<Style, string> = { card: "image", link: "link", plain: "globe" };

/** Fast fetches finish before this, so the "fetching" notice only shows when there is something to wait for. */
const NOTICE_DELAY_MS = 400;

/** Obsidian exposes the CodeMirror view as `editor.cm` but does not type it. */
interface CodeMirrorLike {
  dom: HTMLElement;
  coordsAtPos(pos: number): { left: number; bottom: number } | null;
}

const request: Requester = async (url) => {
  const response = await requestUrl({
    url,
    method: "GET",
    headers: { Accept: "text/html,application/xhtml+xml" },
    throw: false,
  });
  return { status: response.status, headers: response.headers, arrayBuffer: response.arrayBuffer };
};

export default class LinkOrCardPlugin extends Plugin {
  settings: LinkOrCardSettings = { ...DEFAULT_SETTINGS };
  strings: Strings = getStrings(moment.locale());

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor(CARD_LANGUAGE, (source, el, ctx) => {
      renderCard(el, parseCardBlock(source), {
        onOpen: (url) => window.open(url, "_blank"),
        onMenu: (event) => this.showCardMenu(event, el, ctx),
        invalidText: this.strings.invalidCard,
      });
    });

    this.registerEvent(
      this.app.workspace.on("editor-paste", (evt, editor, info) => this.handlePaste(evt, { editor, info })),
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, info) => this.addEditorMenuItems(menu, { editor, info })),
    );

    this.addCommand({
      id: "change-link-style",
      name: this.strings.commandChangeStyle,
      editorCallback: (editor, info) => {
        const target = this.targetAt(editor, editor.getCursor());
        if (target === null) {
          new Notice(this.strings.noLinkAtCursor);
          return;
        }
        this.showMenuAtCursor({ editor, info }, target, CONVERSIONS[target.kind], this.convertLabels());
      },
    });

    this.addSettingTab(new LinkOrCardSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<LinkOrCardSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private handlePaste(evt: ClipboardEvent, context: EditorContext): void {
    if (!this.settings.askOnPaste || evt.defaultPrevented) return;
    const clipboard = evt.clipboardData;
    if (clipboard === null || clipboard.files.length > 0) return;
    const url = parsePastedUrl(clipboard.getData("text/plain"));
    const { editor } = context;
    if (url === null || editor.somethingSelected()) return;
    if (isIgnoredUrl(url, this.settings.ignoredUrls)) return;
    const from = editor.getCursor();
    if (!canTransformPaste(editor, from.line, from.ch)) return;

    // Paste the URL right away, so closing the menu leaves an ordinary paste behind.
    evt.preventDefault();
    editor.replaceRange(url, from);
    const to = { line: from.line, ch: from.ch + url.length };
    editor.setCursor(to);
    this.showMenuAtCursor(context, { kind: "bare", from, to, url }, ["card", "link", "plain"], this.pasteLabels());
  }

  private addEditorMenuItems(menu: Menu, context: EditorContext): void {
    const target = this.targetAt(context.editor, context.editor.getCursor());
    if (target === null) return;
    this.addStyleItems(menu, context, target, CONVERSIONS[target.kind], this.convertLabels());
  }

  /** Right-clicking a rendered card, where the editor cursor cannot reach in Live Preview or Reading view. */
  private showCardMenu(event: MouseEvent, el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const section = ctx.getSectionInfo(el);
    if (view === null || view.file?.path !== ctx.sourcePath || section === null) return;
    const target = this.targetAt(view.editor, { line: section.lineStart, ch: 0 });
    if (target?.kind !== "card") return;

    event.preventDefault();
    event.stopPropagation();
    const menu = new Menu();
    this.addStyleItems(menu, { editor: view.editor, info: view }, target, CONVERSIONS.card, this.convertLabels());
    menu.showAtMouseEvent(event);
  }

  private showMenuAtCursor(context: EditorContext, target: Target, styles: Style[], labels: Record<Style, string>): void {
    const menu = new Menu();
    this.addStyleItems(menu, context, target, styles, labels);
    const cm = (context.editor as unknown as { cm?: CodeMirrorLike }).cm;
    const coords = cm?.coordsAtPos(context.editor.posToOffset(target.to));
    if (cm !== undefined && coords) menu.showAtPosition({ x: coords.left, y: coords.bottom }, cm.dom.ownerDocument);
    else menu.showAtPosition({ x: activeWindow.innerWidth / 2, y: activeWindow.innerHeight / 3 });
  }

  private addStyleItems(
    menu: Menu,
    context: EditorContext,
    target: Target,
    styles: Style[],
    labels: Record<Style, string>,
  ): void {
    for (const style of styles) {
      menu.addItem((item) =>
        item
          .setTitle(labels[style])
          .setIcon(ICONS[style])
          .onClick(() => void this.applyStyle(context, target, style)),
      );
    }
  }

  private pasteLabels(): Record<Style, string> {
    return { card: this.strings.menuCard, link: this.strings.menuLink, plain: this.strings.menuPlain };
  }

  private convertLabels(): Record<Style, string> {
    return { card: this.strings.toCard, link: this.strings.toLink, plain: this.strings.toPlain };
  }

  private targetAt(editor: Editor, pos: EditorPosition): Target | null {
    const block = findCardBlockAt(editor, pos.line);
    if (block !== null) {
      const data = parseCardBlock(block.source);
      if (data === null || safeHttpUrl(data.url) === null) return null;
      const from = { line: block.startLine, ch: editor.getLine(block.startLine).indexOf("```") };
      const to = { line: block.endLine, ch: editor.getLine(block.endLine).length };
      return { kind: "card", from, to, data };
    }
    if (isInsideCodeFence(editor, pos.line) || isInsideFrontmatter(editor, pos.line)) return null;

    const link = findLinkAt(editor.getLine(pos.line), pos.ch);
    if (link === null) return null;
    const from = { line: pos.line, ch: link.from };
    const to = { line: pos.line, ch: link.to };
    return link.kind === "bare"
      ? { kind: "bare", from, to, url: link.url }
      : { kind: "markdown", from, to, url: link.url, text: link.text };
  }

  private async applyStyle(context: EditorContext, target: Target, style: Style): Promise<void> {
    const { editor } = context;

    if (target.kind === "card") {
      const { url, title } = target.data;
      editor.replaceRange(style === "link" && title !== undefined ? formatMarkdownLink(title, url) : url, target.from, target.to);
      return;
    }
    if (style === "plain") {
      if (target.kind === "markdown") editor.replaceRange(target.url, target.from, target.to);
      return;
    }

    // Card and link both need the page. The note may change while it loads.
    const original = editor.getRange(target.from, target.to);
    const path = context.info.file?.path;
    const meta = await this.fetchWithNotice(target.url);
    const range = context.info.file?.path === path ? this.relocate(editor, original, target.from) : null;
    if (range === null) {
      new Notice(this.strings.urlMoved);
      return;
    }

    if (style === "link") {
      const title = meta?.title;
      if (title === undefined) {
        new Notice(this.strings.noTitle);
        return;
      }
      editor.replaceRange(formatMarkdownLink(title, target.url), range.from, range.to);
      return;
    }

    if (meta === null) new Notice(this.strings.cardWithoutMeta);
    const data: CardData = { ...(meta ?? { url: target.url }) };
    if (data.title === undefined && target.kind === "markdown" && target.text.trim() !== "") data.title = target.text;
    const line = editor.getLine(range.from.line);
    editor.replaceRange(blockReplacement(line, range.from.ch, range.to.ch, formatCardBlock(data)), range.from, range.to);
  }

  private relocate(editor: Editor, original: string, from: EditorPosition): { from: EditorPosition; to: EditorPosition } | null {
    const text = editor.getValue();
    const expected = from.line <= editor.lastLine() ? editor.posToOffset(from) : text.length;
    const offset = locateNearest(text, original, expected);
    if (offset === -1) return null;
    return { from: editor.offsetToPos(offset), to: editor.offsetToPos(offset + original.length) };
  }

  private async fetchWithNotice(url: string): Promise<CardData | null> {
    const state: { notice?: Notice } = {};
    const timer = window.setTimeout(() => {
      state.notice = new Notice(this.strings.fetching, 0);
    }, NOTICE_DELAY_MS);
    try {
      return await fetchMetadata(url, request);
    } finally {
      window.clearTimeout(timer);
      state.notice?.hide();
    }
  }
}
